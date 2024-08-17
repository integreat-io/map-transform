import preparePipeline, { TransformDefinition, Options } from './prep/index.js'
import runPipeline, { PreppedPipeline } from './run/index.js'
import { sync as transformers } from './transformers/index.js'
import type State from './state.js'

export interface InitialState {
  context?: unknown[]
  target?: unknown
  rev?: boolean
  noDefaults?: boolean
}

// Prepare the pipelines that have their id in `neededPipelineIds` Set. Return
// a Map of the pipelines.
function preparePipelines(options: Options) {
  const pipelines = new Map()
  if (options.neededPipelineIds && options.pipelines) {
    for (const id of options.neededPipelineIds) {
      const pipeline = options.pipelines[id] // eslint-disable-line security/detect-object-injection
      pipelines.set(id, preparePipeline(pipeline, options))
    }
  }
  return pipelines
}

// Create the transform function. It will run the given prepared pipeline with
// the given state props added to the state object.
function createTransformFunction(
  pipeline: PreppedPipeline,
  stateProps: Partial<State>,
) {
  return (value: unknown, state?: Partial<State>) =>
    runPipeline(value, pipeline, { ...state, ...stateProps })
}

/**
 * Prepare the transform definition and return a function that can be used to
 * transform data. The function takes two arguments: the data to transform and
 * a state object. Set `rev: true` on the state object to run the transform
 * pipeline in reverse.
 *
 * `mapTransform()` may be called recursively by transformers, so to not
 * prepare the same pipelines several times, the rule is that only the first
 * level initiates a `Set` at the `neededPipelineIds` property and prepare the
 * pipelines. The lower levels see that `neededPipelineIds` is already set, and
 * will not touch the `pipelines` property. Instead, it will be already set on
 * the state object by the first level.
 */
export default function mapTransform(
  def: TransformDefinition,
  options: Options,
): (data: unknown, state?: InitialState) => unknown {
  const stateProps: Partial<State> = { nonvalues: options.nonvalues } // These props will be added to the state object

  // Set the `neededPipelineIds` Set and add the built-in transformers.
  options = {
    ...options,
    neededPipelineIds: new Set(),
    transformers: { ...transformers, ...options.transformers },
  }

  // Prepare the pipeline.
  const pipeline = preparePipeline(def, options)

  // Prepare all pipelines that have had their id in set in `neededPipelineIds`
  // during pipeline preparation, and add them to the `pipelines` Map on the
  // state object.
  stateProps.pipelines = preparePipelines(options)

  // Return the transform function.
  return createTransformFunction(pipeline, stateProps)
}
