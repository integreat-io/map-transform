import State, { InitialState } from '../state.js'
import runAltStep, { runAltStepAsync, AltStep } from './alt.js'
import runApplyStep, { runApplyStepAsync, ApplyStep } from './apply.js'
import runMutationStep, {
  runMutationStepAsync,
  MutationStep,
} from './mutation.js'
import runTransformStep, { TransformStep } from './transform.js'
import runValueStep, { ValueStep } from './value.js'
import runPath from './path.js'
import unwindTarget from './unwindTarget.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import { isObject } from '../utils/is.js'
import { revFromState } from '../utils/stateHelpers.js'
import type { Path } from '../types.js'

export interface StepProps {
  it?: boolean
  dir?: number
  nonvalues?: unknown[]
}

export interface OperationStepBase extends StepProps {
  type: string
}

interface StepFunction<T extends OperationStepBase> {
  (value: unknown, step: T, state: State): unknown
}

type StepFunctions = {
  [K in OperationStep['type']]: StepFunction<
    Extract<OperationStep, { type: K }>
  >
}

const syncStepFunctions: StepFunctions = {
  alt: runAltStep,
  apply: runApplyStep,
  mutation: runMutationStep,
  transform: runTransformStep,
  value: runValueStep,
}

const asyncStepFunctions: StepFunctions = {
  alt: runAltStepAsync,
  apply: runApplyStepAsync,
  mutation: runMutationStepAsync,
  transform: runTransformStep,
  value: runValueStep,
}

export type OperationStep =
  | AltStep
  | ApplyStep
  | MutationStep
  | TransformStep
  | ValueStep

export type PreppedStep = Path | OperationStep
export type PreppedPipeline = PreppedStep[]

export interface PreppedOptions {
  pipelines: Map<string | symbol, PreppedPipeline>
  nonvalues?: unknown[]
  modifyOperationObject: (
    operation: Record<string, unknown>,
  ) => Record<string, unknown>
}

const isOperationObject = (step: PreppedStep): step is OperationStep =>
  isObject(step) && typeof step.type === 'string'

const shouldRun = (step: OperationStep, isRev: boolean) =>
  step.dir && typeof step.dir === 'number'
    ? step.dir < 0
      ? isRev
      : !isRev
    : true

const shouldIterate = (
  value: unknown,
  step: OperationStep,
): value is unknown[] => !!step.it && Array.isArray(value)

// Pick the right step runner based on the step type, and run it
function runOp(
  value: unknown,
  step: OperationStep,
  state: State,
  stepFunctions: StepFunctions,
) {
  const stepFunction = stepFunctions[step.type] as StepFunction<typeof step>

  if (!stepFunction) {
    throw new Error(`Unknown operation type '${step.type}'`)
  }

  return stepFunction(value, step, state)
}

// Prepare state before handing it off to a step. If `nonvalues` is an array,
// we'll clone the state, giving it the nonvalues, and making sure we provide
// the same context (no cloning). Otherwise, we'll reuse the state and just set
// the value.
function handOffState(
  state: State,
  value: unknown,
  nonvalues?: unknown[],
  index?: number,
) {
  if (!Array.isArray(nonvalues) && index === undefined) {
    state.value = value
    return state
  } else {
    const nextState = new State(
      {
        ...state,
        ...(Array.isArray(nonvalues) && { nonvalues }),
        ...(index !== undefined && { index }),
      },
      value,
    )
    nextState.replaceContext(state.context)
    return nextState
  }
}

/**
 * Run each step of a pipeline and return the resulting value. Path steps are
 * handled here, but for operation and mutation steps we yield to the caller to
 * let them to run the step as sync or async.
 *
 * Note: We don't currently pay much attention to the value of state here. It
 * is set before handing off to a step, to ensure that transformers etc. that
 * may rely on it will get the correct value, but it is not used in any of the
 * logic for running a pipeline or the steps in it. At some point, we should
 * consider removing it from State (a breaking change) or go all-in and use the
 * state value instead of a separate `value` variable.
 */
function* runOneLevelGen(
  value: unknown,
  pipeline: PreppedPipeline,
  state: State,
  stepFunctions: StepFunctions,
): Generator<unknown, unknown, unknown> {
  // Set the actual rev, based on flip and what not
  const isRev = revFromState(state)

  const targets = unwindTarget(state.target, pipeline, isRev)
  let next = value
  let index = 0

  // We go through each step in the pipeline one by one until we're done
  while (index < pipeline.length) {
    const step = pipeline[index++]
    if (typeof step === 'string') {
      // This is a path step -- handle it for both get and set
      ;[next, index] = runPath(
        next,
        pipeline,
        step,
        index,
        targets,
        handOffState(state, next),
        isRev,
      )
    } else if (isOperationObject(step)) {
      if (shouldRun(step, isRev)) {
        // This is an operation step and we are not being stopped by the
        // direction we are going in -- yield to let the caller run it
        // sync or async
        if (shouldIterate(next, step)) {
          const items = []
          for (let i = 0; i < next.length; i++) {
            const value = next[i] // eslint-disable-line security/detect-object-injection
            items.push(
              yield runOp(
                value,
                step,
                handOffState(state, value, step.nonvalues, i),
                stepFunctions,
              ),
            )
          }
          next = items
        } else {
          next = yield runOp(
            next,
            step,
            handOffState(state, value, step.nonvalues),
            stepFunctions,
          )
        }
      }
    }
  }

  return next
}

/**
 * Run each step of a pipeline and return the resulting value. Call this
 * directly only if you know that the state and the pipeline has been prepared
 * already. Otherwise, use `runPipeline()` instead.
 */
export function runOneLevel(
  value: unknown,
  pipeline: PreppedPipeline,
  state: State,
) {
  // The runing of the steps is handled by a generator, that will yield values
  // that would need to be awaited if we were to run them asynchronously. We
  // don't need to await anything here, but we still need to run the generator
  // to get the result.
  const it = runOneLevelGen(value, pipeline, state, syncStepFunctions)
  return runIterator(it)
}

/**
 * Run each step of a pipeline and return the resulting value. Call this
 * directly only if you know that the state and the pipeline has been prepared
 * already. Otherwise, use `runPipeline()` instead.
 *
 * This is an async version of `runOneLevel()`.
 */
export async function runOneLevelAsync(
  value: unknown,
  pipeline: PreppedPipeline,
  state: State,
) {
  // The runing of the steps is handled by a generator, that will yield values
  // that need to be awaited. This is done in the `runIteratorAsync()` method.
  const it = runOneLevelGen(value, pipeline, state, asyncStepFunctions)
  return runIteratorAsync(it)
}

function adjustPipelineToDirection(pipeline: PreppedPipeline, state: State) {
  const isRev = revFromState(state)

  // Reverse the steps when we're going in reverse
  const directedPipeline = isRev ? [...pipeline].reverse() : pipeline

  // Adjust pipeline for setting to parent or root
  const steps = []
  let skipCount = 0
  for (const step of directedPipeline) {
    if (isRev ? step === '^^' : step === '>^^') {
      // This is a root step -- skip the rest
      break
    } else if (isRev ? step === '^' : step === '>^') {
      // This is a parent step -- count how many to skip after this
      skipCount++
    } else if (skipCount > 0) {
      // We're skipping this step
      skipCount--
    } else {
      // We are not skipping steps
      steps.push(step)
    }
  }

  return steps
}

/**
 * Applies the given pipeline on a value, and returns the resulting value.
 * If a `target` is given, any set steps will be attempted on the target, to
 * modify it with the corresponding values from the pipeline.
 */
export default function runPipeline(
  value: unknown,
  pipeline: PreppedPipeline,
  initialState: InitialState,
) {
  // Create our own state to not affect any parent states.
  const state = new State(initialState, value)

  // Run the pipeline after first adjusting it according to the direction we're
  // going in.
  return runOneLevel(value, adjustPipelineToDirection(pipeline, state), state)
}

export async function runPipelineAsync(
  value: unknown,
  pipeline: PreppedPipeline,
  initialState: InitialState,
) {
  // Create our own state to not affect any parent states.
  const state = new State(initialState, value)

  // Run the pipeline after first adjusting it according to the direction we're
  // going in.
  return runOneLevelAsync(
    value,
    adjustPipelineToDirection(pipeline, state),
    state,
  )
}
