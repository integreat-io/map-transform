import preparePipeline, { TransformDefinition, Options } from './prep/index.js'
import runPipeline, { runPipelineAsync, PreppedPipeline } from './run/index.js'
import {
  sync as syncTransformers,
  async as asyncTransformers,
} from './transformers/index.js'
import State from './state.js'
import { createInternalOptions } from './prepareOptions.js'
import type { Transformer, AsyncTransformer } from './typesNext.js'
import type { Mode } from './prepareOptions.js'

export { syncTransformers, asyncTransformers, State }
export { pathGetter, pathSetter } from './createPathMapper.js'
export { default as prepareOptions } from './prepareOptions.js'

export interface InitialState {
  context?: unknown[]
  target?: unknown
  rev?: boolean
  noDefaults?: boolean
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
  mode: Mode,
): [PreppedPipeline, Partial<State>] {
  const internalOptions = createInternalOptions(options, mode, transformers)
  const pipeline = preparePipeline(def, internalOptions)
  return [
    pipeline,
    {
      nonvalues: options.nonvalues,
      pipelines: internalOptions.preparedPipelines,
    },
  ]
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
    'sync',
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
    'async',
  )
  return createTransformFunctionAsync(pipeline, stateProps)
}
