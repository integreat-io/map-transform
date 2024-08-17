import preparePipeline, { TransformDefinition, Options } from './prep/index.js'
import runPipeline, { PreppedPipeline } from './run/index.js'
import type { State } from './types.js'

export type DataMapper = (value: unknown, state: State) => unknown
export type DataMapperAsync = (value: unknown, state: State) => Promise<unknown>

// Create the transform function. It will run the given prepared pipeline with
// the given state props added to the state object.
function createTransformFunction(pipeline: PreppedPipeline) {
  return (value: unknown, state: State) => runPipeline(value, pipeline, state)
}

export function createDataMapper(
  def: TransformDefinition,
  options: Partial<Options>,
): DataMapper {
  const pipeline = preparePipeline(def, options)
  return createTransformFunction(pipeline)
}
