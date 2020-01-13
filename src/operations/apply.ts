import { Options, Operation, State } from '../types'
import { mapFunctionFromDef } from '../utils/definitionHelpers'
import { setStateValue } from '../utils/stateHelpers'

const extractPipeline = (pipelineId: string, { pipelines }: Options) =>
  pipelineId && pipelines ? pipelines[pipelineId] : undefined // eslint-disable-line security/detect-object-injection

export default function apply(pipelineId: string): Operation {
  return (options: Options) => {
    const pipeline = extractPipeline(pipelineId, options)
    return pipeline
      ? mapFunctionFromDef(pipeline)(options)
      : (state: State) => setStateValue(state, undefined)
  }
}
