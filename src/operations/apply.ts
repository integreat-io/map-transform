import { Options, Operation } from '../types'
import { operationFromDef } from '../utils/definitionHelpers'

const extractPipeline = (pipelineId: string, { pipelines }: Options) =>
  pipelineId && pipelines ? pipelines[pipelineId] : undefined // eslint-disable-line security/detect-object-injection

export default function apply(pipelineId: string): Operation {
  return (options) => (next) => {
    const pipeline = extractPipeline(pipelineId, options)
    return pipeline
      ? operationFromDef(pipeline)(options)(next)
      : (state) => next(state)
  }
}
