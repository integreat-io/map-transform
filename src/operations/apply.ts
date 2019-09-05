import { Options, Operation } from '../types'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const extractPipeline = (pipelineId: string, { pipelines }: Options) =>
  pipelineId && pipelines ? pipelines[pipelineId] : undefined // eslint-disable-line security/detect-object-injection

export default function apply(pipelineId: string): Operation {
  return (options: Options) => {
    const pipeline = extractPipeline(pipelineId, options)
    return mapFunctionFromDef(pipeline || null)(options)
  }
}
