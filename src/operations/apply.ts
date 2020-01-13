import { Options, Operation, State, StateMapper } from '../types'
import { mapFunctionFromDef } from '../utils/definitionHelpers'
import { setStateValue } from '../utils/stateHelpers'

const extractPipeline = (pipelineId: string, { pipelines }: Options) =>
  pipelineId && pipelines ? pipelines[pipelineId] : undefined // eslint-disable-line security/detect-object-injection

const undefinedGuard = (fn: StateMapper) => (state: State) =>
  state.value === undefined ? state : fn(state)

export default function apply(pipelineId: string): Operation {
  return (options: Options) => {
    const pipeline = extractPipeline(pipelineId, options)
    return undefinedGuard(
      pipeline
        ? mapFunctionFromDef(pipeline)(options)
        : (state: State) => setStateValue(state, undefined)
    )
  }
}
