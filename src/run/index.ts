import State, { type InitialState } from '../state.js'
import runAltStep, { runAltStepAsync, type AltStep } from './alt.js'
import runApplyStep, { runApplyStepAsync, type ApplyStep } from './apply.js'
import runArrayStep, { runArrayStepAsync, type ArrayStep } from './array.js'
import runFilterStep, { runFilterStepAsync, type FilterStep } from './filter.js'
import runIfStep, { runIfStepAsync, type IfStep } from './if.js'
import runIterateStep, {
  runIterateStepAsync,
  type IterateStep,
} from './iterate.js'
import runMutationStep, {
  runMutationStepAsync,
  type MutationStep,
} from './mutation.js'
import runTransformStep, {
  runTransformStepAsync,
  type TransformStep,
} from './transform.js'
import runValueStep, { type ValueStep } from './value.js'
import runPath from './path.js'
import resolveParentSets from './resolveParentSets.js'
import unwindTarget from './unwindTarget.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import { isObject } from '../utils/is.js'
import xor from '../utils/xor.js'
import { ensureArray } from '../utils/array.js'
import type { Path } from '../typesNext.js'

export interface StepProps {
  it?: boolean
  dir?: number
  nonvalues?: unknown[]
  noDefaults?: boolean
}

export interface OperationStepBase extends StepProps {
  type: string
}

type StepFunction<T extends OperationStepBase> = (
  value: unknown,
  step: T,
  state: State,
) => unknown

type StepFunctions = {
  [K in OperationStep['type']]: StepFunction<
    Extract<OperationStep, { type: K }>
  >
}

const syncStepFunctions: StepFunctions = {
  alt: runAltStep,
  apply: runApplyStep,
  array: runArrayStep,
  filter: runFilterStep,
  if: runIfStep,
  iterate: runIterateStep,
  mutation: runMutationStep,
  transform: runTransformStep,
  value: runValueStep,
}

const asyncStepFunctions: StepFunctions = {
  alt: runAltStepAsync,
  apply: runApplyStepAsync,
  array: runArrayStepAsync,
  filter: runFilterStepAsync,
  if: runIfStepAsync,
  iterate: runIterateStepAsync,
  mutation: runMutationStepAsync,
  transform: runTransformStepAsync,
  value: runValueStep,
}

export type OperationStep =
  | AltStep
  | ApplyStep
  | ArrayStep
  | FilterStep
  | IfStep
  | IterateStep
  | MutationStep
  | TransformStep
  | ValueStep

export type PreppedStep = Path | OperationStep
export type PreppedPipeline = PreppedStep[]

const isOperationObject = (step: PreppedStep): step is OperationStep =>
  isObject(step) && typeof step.type === 'string'

/**
 * Return true if the given pipeline has one or more set steps. We take into
 * account whether we are going forward or in reverse.
 */
export const hasSetSteps = (pipeline: PreppedPipeline, isRev: boolean) =>
  pipeline.some(
    (step) => typeof step === 'string' && xor(step.startsWith('>'), isRev),
  )

/**
 * Return true if the step should be run based on the direction set on the
 * operation object. If `dir` is negative, it should only be run in reverse, if
 * it's positive, it should only be run when we're going forward. `0` or
 * `undefined` means it may be run in both directions.
 */
const shouldRun = (step: OperationStep, isRev: boolean) =>
  step.dir && typeof step.dir === 'number'
    ? step.dir < 0
      ? isRev
      : !isRev
    : true

/**
 * Return `true` if the step has the `it` flag set to `true` (meaning that the
 * original definition had `$iterate: true`) or the value is an array.
 */
const shouldIterate = (
  value: unknown,
  step: OperationStep,
): value is unknown[] => !!step.it && Array.isArray(value)

/**
 *  Pick the right step runner based on the step type.
 */
function getRunnerForStep(step: OperationStep, stepFunctions: StepFunctions) {
  const stepFunction = stepFunctions[step.type] as StepFunction<typeof step>
  if (stepFunction) {
    return stepFunction
  } else {
    throw new Error(`Unknown operation type '${step.type}'`)
  }
}

/**
 * Prepare state before handing it off to a step. If `nonvalues` is an array or
 * `noDefaults` is set`, we'll clone the state, giving it the nonvalues, and
 * making sure we provide the same context (no cloning). Otherwise, we'll reuse
 * the state and just set the value.
 */
function handOffState(
  state: State,
  value: unknown,
  nonvalues?: unknown[],
  noDefaults?: boolean,
  index?: number,
) {
  if (
    !Array.isArray(nonvalues) &&
    noDefaults === undefined &&
    index === undefined
  ) {
    state.value = value
    return state
  } else {
    return new State(
      {
        ...state,
        ...(Array.isArray(nonvalues) && { nonvalues }),
        ...(typeof noDefaults === 'boolean' ? { noDefaults } : {}),
        ...(index !== undefined && { index }),
      },
      value,
    )
  }
}

/**
 * Call the given operation runner. The state is updated with the value and
 * potentially any `nonvalues` provided on the step, and `index`.
 */
const runStep = (
  runner: StepFunction<OperationStep>,
  value: unknown,
  step: OperationStep,
  state: State,
  index?: number,
) =>
  runner(
    value,
    step,
    handOffState(state, value, step.nonvalues, step.noDefaults, index),
  )

function* iterateOverArray(
  value: unknown[],
  target: unknown[],
  state: State,
  processor: (item: unknown, state: State, index: number) => unknown,
) {
  const items: unknown[] = []
  for (let i = 0; i < value.length; i++) {
    const item = value[i] // eslint-disable-line security/detect-object-injection
    const nextState = new State({ ...state, target: target[i] }, item) // eslint-disable-line security/detect-object-injection
    items.push(yield processor(item, nextState, i))
  }
  return items
}

/**
 * Run each step of a pipeline and return the resulting value. Path steps are
 * handled here, but for operation and mutation steps we yield the value to the
 * caller to let them await the value if necessary. This lets us use the same
 * logic for both sync and async pipelines, with almost no duplication of code.
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
  runOneLevel: (
    value: unknown,
    pipeline: PreppedPipeline,
    state: State,
  ) => unknown,
): Generator<unknown, unknown, unknown> {
  // Set the actual rev, based on flip and what not
  const isRev = state.isRev

  // Resolve parent and root set steps, and find the target to set on. The
  // targets for the set steps in this pipeline are pushed to the target
  // context, so that the set steps may pop them, and so that any nested
  // pipelines may set on them through their own parent set steps.
  const { targetContext } = state
  const depth = targetContext.length
  const [steps, parentLevel] = resolveParentSets(pipeline, isRev, depth)
  const baseTarget =
    parentLevel === undefined
      ? state.target
      : parentLevel >= 0
        ? targetContext[parentLevel] // eslint-disable-line security/detect-object-injection
        : undefined
  const hasTargets = hasSetSteps(steps, isRev)
  targetContext.push(...unwindTarget(baseTarget, steps, isRev))

  let next = value
  let index = 0
  let doIterate: boolean | undefined

  // We go through each step in the pipeline one by one until we're done
  while (index < steps.length) {
    const step = steps[index++]
    if (typeof step === 'string') {
      // This is a path step -- handle it for both get and set.
      const prevIndex = index
      ;[next, index, doIterate] = runPath(
        next,
        steps,
        step,
        index,
        handOffState(state, next),
        isRev,
      )

      if (doIterate && Array.isArray(next)) {
        // The path step returned with the `doIterate` flag set, so we'll
        // iterate of a subset of the pipeline -- from this step to the index
        // set to `index`. We'll also iterate over the target if there are set
        // steps in the pipeline. The array is a level of its own, so the
        // target array is pushed to the target context while we iterate.
        const subPipeline = steps.slice(prevIndex - 1, index) // Iteration from this step to a qualified set operation
        const target = hasSetSteps(subPipeline, isRev)
          ? targetContext.pop()
          : undefined
        const targetArr = ensureArray(target, state.nonvalues) // Make sure we have a target array
        const processor = (item: unknown, state: State) =>
          runOneLevel(item, subPipeline, state)
        targetContext.push(target)
        const arr = yield* iterateOverArray(next, targetArr, state, processor)
        targetContext.pop()
        next = arr.flat()
        // Remove the array from context after iteration, matching the
        // push/pop pattern used for operation iteration ($iterate).
        state.context.pop()
      }
    } else if (isOperationObject(step)) {
      if (shouldRun(step, state.rev)) {
        // This is an operation step and we are not being stopped by the
        // direction we are going in. Get the right operation runner for this
        // step.
        const runner = getRunnerForStep(step, stepFunctions)
        const contextDepth = state.context.length

        if (shouldIterate(next, step)) {
          // We are iterating, so pass each value in the `next` array to the
          // operation runner. The index is set on the state to be available to
          // transformers. We push the array to the context before iterating,
          // and remove it afterwards, so that the array is available to parent
          // paths during iteration. The array is a level in the target context
          // too, but there is no target for it.
          state.context.push(next) // Push the array to the context
          targetContext.push(undefined)
          const processor = (item: unknown, state: State, index: number) =>
            runStep(runner, item, step, state, index)
          next = yield* iterateOverArray(next, [], state, processor)
          targetContext.pop()
          state.context.pop() // Remove the array from the context after iteration
        } else {
          // This is a single value, so just pass it to the operation runner.
          next = yield runStep(runner, next, step, state)
        }

        // Operations are opaque to the context -- whatever they did to it, the
        // next step sees the context as it was before the operation.
        state.context.length = contextDepth
      }
    }
  }

  // Leave the target context as we found it
  targetContext.length = depth

  if (parentLevel === undefined) {
    return next
  } else if (parentLevel >= 0 && hasTargets) {
    // We have set on a parent level, so record the result there and leave the
    // current target untouched
    targetContext[parentLevel] = next // eslint-disable-line security/detect-object-injection
  }
  // A missing parent level drops the value
  return state.target
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
  const it = runOneLevelGen(
    value,
    pipeline,
    state,
    syncStepFunctions,
    runOneLevel,
  )
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
  const it = runOneLevelGen(
    value,
    pipeline,
    state,
    asyncStepFunctions,
    runOneLevelAsync,
  )
  return runIteratorAsync(it)
}

// Reverse the pipeline when we are going in reverse.
const adjustPipelineToDirection = (pipeline: PreppedPipeline, state: State) =>
  state.isRev ? [...pipeline].reverse() : pipeline

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
