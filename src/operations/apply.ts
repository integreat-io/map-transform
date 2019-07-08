import { Options, Operation } from '../types'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const extractPipeline = (pipelineId: string, { pipelines }: Options = {}) =>
  pipelineId && pipelines ? pipelines[pipelineId] : undefined

export default function apply(pipelineId: string): Operation {
  return (options: Options) => {
    const pipeline = extractPipeline(pipelineId, options)
    return mapFunctionFromDef(pipeline || null, options)
  }
}
