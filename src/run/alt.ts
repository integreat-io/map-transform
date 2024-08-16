import State from '../state.js'
import runPipeline, { runOneLevel } from './index.js'
import { isNonvalue } from '../utils/is.js'
import { revFromState } from '../utils/stateHelpers.js'
import type { PreppedPipeline } from './index.js'

export interface AltStep {
  type: 'alt'
  useLastAsDefault?: boolean
  pipelines: PreppedPipeline[]
}

// Run each pipeline until we get a value -- or return undefined.
function getWithAltPipelines(
  value: unknown,
  pipelines: PreppedPipeline[],
  state: State,
) {
  for (const pipeline of pipelines) {
    // Run a pipeline on the value. We create a cloned state for every pipeline
    // so they won't interfere with each other. We do the cloning here, to be
    // able to retrieve the context from the "winner".
    const nextState = new State(state)
    const next = runOneLevel(value, pipeline, nextState)
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

// Use the first pipeline to set the value. If `useLastAsDefault` is `true`,
// we use the last pipeline to get a default value when we have a non-value.
function setWithAltPipelines(
  value: unknown,
  pipelines: PreppedPipeline[],
  state: State,
  useLastAsDefault: boolean,
) {
  if (
    useLastAsDefault &&
    pipelines.length > 1 &&
    isNonvalue(value, state.nonvalues)
  ) {
    // We have a non-value, there are more than one pipelne, and
    // `useLastAsDefault` is `true`. Get the default value.
    const lastPipeline = pipelines[pipelines.length - 1]
    value = runPipeline(value, lastPipeline, {
      ...state,
      rev: false,
      flip: false,
    })
  }

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
  return isRev
    ? setWithAltPipelines(value, pipelines, state, useLastAsDefault)
    : getWithAltPipelines(value, pipelines, state)
}
