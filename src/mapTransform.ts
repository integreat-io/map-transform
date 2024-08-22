import preparePipeline, { TransformDefinition, Options } from './prep/index.js'
import runPipeline, { runPipelineAsync, PreppedPipeline } from './run/index.js'
import {
  sync as syncTransformers,
  async as asyncTransformers,
} from './transformers/index.js'
import type State from './state.js'
import { Transformer, AsyncTransformer } from './types.js'

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

// Create a synchronous transform function. It will run the given prepared
// the given state props added to the state object.
function createTransformFunction(
  pipeline: PreppedPipeline,
  stateProps: Partial<State>,
) {
  return (value: unknown, state?: Partial<State>) =>
    runPipeline(value, pipeline, { ...state, ...stateProps })
}

// Create an asynchronous transform function. It will run the given prepared
// the given state props added to the state object.
function createTransformFunctionAsync(
  pipeline: PreppedPipeline,
  stateProps: Partial<State>,
) {
  return async (value: unknown, state?: Partial<State>) =>
    runPipelineAsync(value, pipeline, { ...state, ...stateProps })
}

function preparePipelinesAndStateProps(
  def: TransformDefinition,
  options: Options,
  transformers: Record<string, Transformer | AsyncTransformer>,
): [PreppedPipeline, Partial<State>] {
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

  // Return the pipeline and state props.
  return [pipeline, stateProps]
}

/**
 * Prepare the transform definition and return a function that can be used to
 * transform data. The returned function takes two arguments: the data to
 * transform and a state object. Set `rev: true` on the state object to run the
 * transform pipeline in reverse.
 *
 * Use `mapTransformAsync()` if you need to transform data asynchronously.
 */
export default function mapTransform(
  def: TransformDefinition,
  options: Options = {},
): (data: unknown, state?: InitialState) => unknown {
  const [pipeline, stateProps] = preparePipelinesAndStateProps(
    def,
    options,
    syncTransformers,
  )
  return createTransformFunction(pipeline, stateProps)
}

/**
 * Prepare the transform definition and return an _async_ function that can be
 * used to transform data. The returned function takes two arguments: the data
 * to transform and a state object. Set `rev: true` on the state object to run
 * the transform pipeline in reverse.
 *
 * Use `mapTransform()` if you don't need to transform data asynchronously.
 */
export function mapTransformAsync(
  def: TransformDefinition,
  options: Options = {},
): (data: unknown, state?: InitialState) => Promise<unknown> {
  const [pipeline, stateProps] = preparePipelinesAndStateProps(
    def,
    options,
    asyncTransformers,
  )
  return createTransformFunctionAsync(pipeline, stateProps)
}
