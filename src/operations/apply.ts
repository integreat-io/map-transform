import { Options, Operation, State } from '../types'
import { operationFromDef } from '../utils/definitionHelpers'

const extractPipeline = (pipelineId: string, { pipelines }: Options) =>
  pipelineId && pipelines ? pipelines[pipelineId] : undefined // eslint-disable-line security/detect-object-injection

const removeFlip = ({ flip, ...state }: State) => state

export default function apply(pipelineId: string): Operation {
  return (options) => (next) => {
    const pipeline = extractPipeline(pipelineId, options)
    const fn = pipeline ? operationFromDef(pipeline)(options)(next) : next
    return (state) => fn(removeFlip(state))
  }
}
