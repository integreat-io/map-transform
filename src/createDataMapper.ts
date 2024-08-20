import preparePipeline, { TransformDefinition, Options } from './prep/index.js'
import runPipeline, { runPipelineAsync, PreppedPipeline } from './run/index.js'
import type { State } from './types.js'

export type DataMapper = (value: unknown, state: State) => unknown
export type DataMapperAsync = (value: unknown, state: State) => Promise<unknown>

// Create the synchronous transform function.
export function createTransformFunction(pipeline: PreppedPipeline) {
  return (value: unknown, state: State) => runPipeline(value, pipeline, state)
}

// Create the asynchronous transform function.
function createTransformFunctionAsync(pipeline: PreppedPipeline) {
  return (value: unknown, state: State) =>
    runPipelineAsync(value, pipeline, state)
}

/**
 * Create a data mapper function from a transform definition. This function
 * does not prepare anything besides the definition, and is intended to be
 * used within the scope of the `mapTransform()` function.
 */
export function createDataMapper(
  def: TransformDefinition,
  options: Partial<Options>,
): DataMapper {
  const pipeline = preparePipeline(def, options)
  return createTransformFunction(pipeline)
}

/**
 * Create an async data mapper function from a transform definition. This
 *  function does not prepare anything besides the definition, and is intended
 * to be used within the scope of the `mapTransformAsync()` function.
 */
export function createDataMapperAsync(
  def: TransformDefinition,
  options: Partial<Options>,
): DataMapperAsync {
  const pipeline = preparePipeline(def, options)
  return createTransformFunctionAsync(pipeline)
}
