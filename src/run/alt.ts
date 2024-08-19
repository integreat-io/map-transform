import State from '../state.js'
import runPipeline, {
  runPipelineAsync,
  runOneLevel,
  runOneLevelAsync,
} from './index.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import { isNonvalue } from '../utils/is.js'
import { revFromState } from '../utils/stateHelpers.js'
import type { PreppedPipeline } from './index.js'

export interface AltStep {
  type: 'alt'
  useLastAsDefault?: boolean
  pipelines: PreppedPipeline[]
}

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
    if (!isNonvalue(next, state.nonvalues)) {
      // We have a value -- update the state context from this pipeline and
      // return the value.
      state.replaceContext(nextState.context)
      return next
    }
  }

  // No pipeline returned a value -- return undefined.
  return undefined
}

// Retrurn `true` if the value is non-value, `useLastAsDefault` is `true`, and
// there are more than one pipline, we should get a default value from the last
// pipeline.
const shouldUseDefault = (
  value: unknown,
  pipelines: PreppedPipeline[],
  state: State,
  useLastAsDefault: boolean,
) =>
  useLastAsDefault && pipelines.length > 1 && isNonvalue(value, state.nonvalues)

// Get a default value from the last pipeline.
function getDefaultValue(
  pipelines: PreppedPipeline[],
  state: State,
  isAsync = false,
) {
  const lastPipeline = pipelines[pipelines.length - 1]
  const nextState = new State({
    ...state,
    rev: false,
    flip: false,
  })
  return isAsync
    ? runPipelineAsync(undefined, lastPipeline, nextState)
    : runPipeline(undefined, lastPipeline, nextState)
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
 * most likely to be the wanted reverse version.
 *
 * There is a special case when `useLastAsDefault` is `true` and we have a
 * non-value in reverse. In this case assume that the last pipeline will return
 * a default value, so we run it forward and give the resulting value to the
 * first pipeline. This is a way to use a default value in both directions.
 */
export default function runAltStep(
  value: unknown,
  { pipelines, useLastAsDefault = false }: AltStep,
  state: State,
) {
  const isRev = revFromState(state)
  if (isRev) {
    if (shouldUseDefault(value, pipelines, state, useLastAsDefault)) {
      value = getDefaultValue(pipelines, state)
    }
    return setWithAltPipelines(value, pipelines, state)
  } else {
    // The piplines are run with a generator that yields each value so that we
    // could have await it if this was an async method. We still need to run
    // through the iterator to get the result, and this is handled by
    // `runIteratorAsync()`.
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
 * most likely to be the wanted reverse version.
 *
 * There is a special case when `useLastAsDefault` is `true` and we have a
 * non-value in reverse. In this case assume that the last pipeline will return
 * a default value, so we run it forward and give the resulting value to the
 * first pipeline. This is a way to use a default value in both directions.
 *
 * This is an async version of `runAltStep()`.
 */
export async function runAltStepAsync(
  value: unknown,
  { pipelines, useLastAsDefault = false }: AltStep,
  state: State,
) {
  const isRev = revFromState(state)
  if (isRev) {
    if (shouldUseDefault(value, pipelines, state, useLastAsDefault)) {
      value = await getDefaultValue(pipelines, state, true)
    }
    return await setWithAltPipelines(value, pipelines, state)
  } else {
    // The piplines are run with a generator that yields each value so that we
    // can await it. Running the iterator is handled by `runIteratorAsync()`.
    const it = getWithAltPipelines(value, pipelines, state, true)
    return runIteratorAsync(it)
  }
}
