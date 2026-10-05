import State from '../state.js'
import runPipeline, {
  runOneLevel,
  runOneLevelAsync,
  OperationStepBase,
} from './index.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import { isNonvalue } from '../utils/is.js'
import type { PreppedPipeline, PreppedStep } from './index.js'

export interface AltStep extends OperationStepBase {
  type: 'alt'
  pipelines: PreppedPipeline[]
}

// Will check whether the original value is the same as the next value. If it
// is and we don't have an empty pipeline (which would tell us that this is
// what we want), we return `true`.
//
// TODO: We might want to limit this comparison to only objects, as plain
// values may be equal after the pipeline even though they have been modified.
const isUntouchedValue = (
  value: unknown,
  nextValue: unknown,
  pipeline: PreppedPipeline,
) => value === nextValue && pipeline.length > 0

// Run each pipeline until we get a value -- or return undefined.
function* getWithAltPipelines(
  value: unknown,
  pipelines: PreppedPipeline[],
  state: State,
  isAsync = false,
): Generator<unknown, unknown, unknown> {
  for (const [index, pipeline] of pipelines.entries()) {
    // Run a pipeline on the value. We create a cloned state for every pipeline
    // so they won't interfere with each other or with the outer context.
    const nextState = new State(state)
    const next = yield isAsync
      ? runOneLevelAsync(value, pipeline, nextState)
      : runOneLevel(value, pipeline, nextState)
    if (
      !isUntouchedValue(value, next, pipeline) &&
      (!isNonvalue(next, state.nonvalues) || index === pipelines.length - 1)
    ) {
      // We have a value, or we have reached the last pipeline. Return the
      // value, even it is a non-value.
      return next
    }
  }

  // No pipeline returned a value -- return undefined.
  return undefined
}

const isValueStep = (step: PreppedStep) =>
  typeof step !== 'string' && step.type === 'value'

// Only pipelines of value steps are used for defaults in reverse, as any other
// pipeline would depend on the forward data.
const isDefaultPipeline = (pipeline: PreppedPipeline) =>
  pipeline.length > 0 && pipeline.every(isValueStep)

// Get a default value from the pipelines the same way as we would going
// forward, skipping the first one, as we'll set with it. When there is no
// default, we keep the value.
function* getDefaultValue(
  value: unknown,
  pipelines: PreppedPipeline[],
  state: State,
  isAsync = false,
): Generator<unknown, unknown, unknown> {
  const defaultPipelines = pipelines.slice(1).filter(isDefaultPipeline)
  const defaultValue = yield* getWithAltPipelines(
    undefined,
    defaultPipelines,
    state,
    isAsync,
  )
  return defaultValue === undefined ? value : defaultValue
}

// Use the first pipeline to set the value.
function setWithAltPipelines(
  value: unknown,
  pipelines: PreppedPipeline[],
  state: State,
) {
  // Set value with the first pipeline
  const firstPipeline = pipelines[0]
  return runPipeline(value, firstPipeline, state)
}

/**
 * Run several pipelines until one of them returns a value. If no pipelines
 * returns a value, `undefined` is returned. The `state` context is left
 * untouched.
 *
 * In reverse, the first pipeline will be used to set the `value`, as this is
 * most likely to be the wanted reverse version. If the value is a nonvalue, we
 * will attempt to get a default value from the other pipelines that only have
 * value steps, the same way as going forward.
 *
 * This version does not support async pipelines.
 */
export default function runAltStep(
  value: unknown,
  { pipelines }: AltStep,
  state: State,
) {
  if (state.isRev) {
    if (isNonvalue(value, state.nonvalues)) {
      const it = getDefaultValue(value, pipelines, state)
      value = runIterator(it)
    }
    return setWithAltPipelines(value, pipelines, state)
  } else {
    // The piplines are run with a generator that yields each value. The sync
    // version simply returns the value to the generator in the
    // `runIterator()`.
    const it = getWithAltPipelines(value, pipelines, state)
    return runIterator(it)
  }
}

/**
 * Run several pipelines until one of them returns a value. If no pipelines
 * returns a value, `undefined` is returned. The `state` context is left
 * untouched.
 *
 * In reverse, the first pipeline will be used to set the `value`, as this is
 * most likely to be the wanted reverse version. If the value is a nonvalue, we
 * will attempt to get a default value from the other pipelines that only have
 * value steps, the same way as going forward.
 *
 * This version supports async pipelines.
 */
export async function runAltStepAsync(
  value: unknown,
  { pipelines }: AltStep,
  state: State,
) {
  if (state.isRev) {
    if (isNonvalue(value, state.nonvalues)) {
      const it = getDefaultValue(value, pipelines, state, true)
      value = await runIteratorAsync(it)
    }
    return await setWithAltPipelines(value, pipelines, state)
  } else {
    // The piplines are run with a generator that yields each value so that we
    // can await it. Running the iterator is handled by `runIteratorAsync()`.
    const it = getWithAltPipelines(value, pipelines, state, true)
    return runIteratorAsync(it)
  }
}
