import preparePipeline, { TransformDefinition, Options } from './prep/index.js'
import runPipeline, { runPipelineAsync, PreppedPipeline } from './run/index.js'
import {
  sync as syncTransformers,
  async as asyncTransformers,
} from './transformers/index.js'
import prepareOptions, {
  prepareOptionsWithBookKeeping,
  withBookKeeping,
} from './prepareOptions.js'
import State from './state.js'
import type { Variant, VariantBookKeeping } from './prepareOptions.js'

export { syncTransformers, asyncTransformers, State, prepareOptions }
export { pathGetter, pathSetter } from './createPathMapper.js'

export interface InitialState {
  context?: unknown[]
  target?: unknown
  rev?: boolean
  noDefaults?: boolean
}

// Prepare the pipelines that have had their id added to `neededPipelineIds`,
// and set them on the `pipelines` Map. Pipelines that are already prepared are
// left alone, so preparing the same options again is free, and preparing a
// pipeline may mark more pipelines as needed -- as a `Set` yields values added
// while we're iterating it, these are prepared too.
function preparePipelines(
  { neededPipelineIds, pipelines }: VariantBookKeeping,
  options: Options,
) {
  for (const id of neededPipelineIds) {
    if (pipelines.has(id) || !options.pipelines) {
      continue
    }

    // Set an empty pipeline before we prepare, so that a transformer that runs
    // map-transform with our options while we're preparing won't start
    // preparing this pipeline again. We fill the very same array below, so
    // anyone holding on to it still ends up with the prepared steps.
    const pipeline: PreppedPipeline = []
    pipelines.set(id, pipeline)
    try {
      pipeline.push(...preparePipeline(options.pipelines[id], options)) // eslint-disable-line security/detect-object-injection
    } catch (error) {
      pipelines.delete(id)
      throw error
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
  rawOptions: Options,
  variant: Variant,
): [PreppedPipeline, Partial<State>] {
  // Prepare the options, unless they are already prepared. Prepared options
  // hold the transformers and the prepared pipelines for both variants, and
  // are shared by every `mapTransform()` call they are given to.
  const [preparedOptions, book] = prepareOptionsWithBookKeeping(rawOptions)
  const variantBook = book[variant] // eslint-disable-line security/detect-object-injection
  const { transformers, neededPipelineIds } = variantBook

  // Make our own copy of the options for this variant, and give it the same
  // book-keeping, so that a transformer running map-transform with the options
  // it is given will share our prepared pipelines.
  const options = withBookKeeping(
    { ...preparedOptions, transformers, neededPipelineIds },
    book,
  )

  // Prepare the pipeline. Any `$apply` operation will add its pipeline id to
  // `neededPipelineIds` while we do.
  const pipeline = preparePipeline(def, options)

  // Prepare the pipelines that are needed but not prepared yet, and hand the
  // Map of them to the state object.
  const stateProps: Partial<State> = {
    nonvalues: rawOptions.nonvalues,
    pipelines: preparePipelines(variantBook, options),
  }

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
    'async',
  )
  return createTransformFunctionAsync(pipeline, stateProps)
}
