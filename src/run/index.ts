import State, { InitialState } from '../state.js'
import runAltStep, { AltStep } from './alt.js'
import runMutationStep, { MutationStep } from './mutation.js'
import runTransformStep, { TransformStep } from './transform.js'
import runValueStep, { ValueStep } from './value.js'
import runPath from './path.js'
import unwindTarget from './unwindTarget.js'
import { isObject } from '../utils/is.js'
import { revFromState } from '../utils/stateHelpers.js'
import type { Path } from '../types.js'

export interface StepProps {
  it?: boolean
  dir?: number
  nonvalues?: unknown[]
}

export type OperationStep = (
  | AltStep
  | MutationStep
  | TransformStep
  | ValueStep
) &
  StepProps
export type PreppedStep = Path | OperationStep
export type PreppedPipeline = PreppedStep[]

export type RunStep<T extends OperationStep> = (
  value: unknown,
  step: T,
  state: State,
) => unknown

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

function getOperationForStep<T extends OperationStep>(
  step: T,
): RunStep<T> | undefined {
  switch (step.type) {
    case 'mutation':
      return runMutationStep as RunStep<T> // TODO: Make typing work without forcing to RunStep?
    case 'value':
      return runValueStep as RunStep<T>
    case 'transform':
      return runTransformStep as RunStep<T>
    case 'alt':
      return runAltStep as RunStep<T>
    default:
      return undefined
  }
}

// Prepare state before handing it off to a step. If `nonvalues` is an array,
// we'll clone the state, giving it the nonvalues, and making sure we provide
// the same context (no cloning). Otherwise, we'll reuse the state and just set
// the value.
function handOffState(state: State, value: unknown, nonvalues?: unknown[]) {
  if (Array.isArray(nonvalues)) {
    const nextState = new State({ ...state, nonvalues }, value)
    nextState.replaceContext(state.context)
    return nextState
  } else {
    state.value = value
    return state
  }
}

/**
 * Run one the pipeline until a point where it needs to hand off to another
 * level (currently because of iteration). Will finish any remainder of the
 * pipeline when the lower levels are done.
 *
 * Note: We don't currently pay much attention to the value of state here. It
 * is set before handing off to a step, to ensure that transformers etc. that
 * may rely on it will get the correct value, but it is not used in any of the
 * logic for running a pipeline or the steps in it. At some point, we should
 * consider removing it from State (a breaking change) or go all-in and use the
 * state value instead of a separate `value` variable.
 */
export function runOneLevel(
  value: unknown,
  pipeline: PreppedPipeline,
  state: State,
) {
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
      const op = getOperationForStep(step)
      if (op && shouldRun(step, isRev)) {
        // This is an operation step and we are not being stopped by the
        // direction we are going in -- run it with or without iterating
        next = shouldIterate(next, step)
          ? next.map((value) =>
              op(value, step, handOffState(state, value, step.nonvalues)),
            )
          : op(next, step, handOffState(state, next, step.nonvalues))
      }
    }
  }

  return next
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
