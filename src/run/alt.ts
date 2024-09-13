import State from '../state.js'
import runPipeline, {
  runPipelineAsync,
  runOneLevel,
  runOneLevelAsync,
  OperationStepBase,
} from './index.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import { isNonvalue } from '../utils/is.js'
import { revFromState } from '../utils/stateHelpers.js'
import type { PreppedPipeline } from './index.js'

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
  for (const pipeline of pipelines) {
    // Run a pipeline on the value. We create a cloned state for every pipeline
    // so they won't interfere with each other. We do the cloning here, to be
    // able to retrieve the context from the "winner".
    const nextState = new State(state)
    const next = yield isAsync
      ? runOneLevelAsync(value, pipeline, nextState)
      : runOneLevel(value, pipeline, nextState)
    if (
      !isUntouchedValue(value, next, pipeline) &&
      !isNonvalue(next, state.nonvalues)
    ) {
      // We have a value -- update the state context from this pipeline and
      // return the value.
      state.context = nextState.context
      return next
    }
  }

  // No pipeline returned a value -- return undefined.
  state.context.push(value)
  return undefined
}

// Return `true` if the value is non-value and there are more than one pipline.
const shouldUseDefault = (
  value: unknown,
  pipelines: PreppedPipeline[],
  state: State,
) => pipelines.length > 1 && isNonvalue(value, state.nonvalues)

// Get a default value from the pipelines, starting with the last. We skip the
// first one since this is only used in rev, and we'll then set with the first
// one.
//
// TODO: Is it correct to pass these pipelines `undefined`? It would make sense
// as we are looking for default values, but could there be cases where a
// default value is still dependant on the original pipeline value? In that
// case, we would also have to check for directions or that the value has
// changed, as a pipeline with a value operator for the other direction, would
// yield the original pipeline value and that is not what we want.
function* getDefaultValue(
  pipelines: PreppedPipeline[],
  state: State,
  isAsync = false,
): Generator<unknown, unknown, unknown> {
  const defaultPipelines = pipelines.slice(1).reverse()

  for (const pipeline of defaultPipelines) {
    const value = yield isAsync
      ? runPipelineAsync(undefined, pipeline, state)
      : runPipeline(undefined, pipeline, state)
    if (!isUntouchedValue(undefined, value, pipeline) && !isNonvalue(value)) {
      return value
    }
  }
  return undefined
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
 * returns a value, `undefined` is returned. The `state` context will be
 * updated as if only the "winning" pipeline ran.
 *
 * In reverse, the first pipeline will be used to set the `value`, as this is
 * most likely to be the wanted reverse version. If any of the other pipelines
 * contains a $value operator, we will attempt to get a default value from
 * them, starting with the last pipeline and going backwards.
 *
 * This version does not support async pipelines.
 */
export default function runAltStep(
  value: unknown,
  { pipelines }: AltStep,
  state: State,
) {
  const isRev = revFromState(state)
  if (isRev) {
    if (shouldUseDefault(value, pipelines, state)) {
      const it = getDefaultValue(pipelines, state)
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
 * returns a value, `undefined` is returned. The `state` context will be
 * updated as if only the "winning" pipeline ran.
 *
 * In reverse, the first pipeline will be used to set the `value`, as this is
 * most likely to be the wanted reverse version. If any of the other pipelines
 * contains a $value operator, we will attempt to get a default value from
 * them, starting with the last pipeline and going backwards.
 *
 * This version supports async pipelines.
 */
export async function runAltStepAsync(
  value: unknown,
  { pipelines }: AltStep,
  state: State,
) {
  const isRev = revFromState(state)
  if (isRev) {
    if (shouldUseDefault(value, pipelines, state)) {
      const it = getDefaultValue(pipelines, state, true)
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
