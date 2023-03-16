import { Options, Operation, State } from '../types.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import { identity } from '../utils/functional.js'

const extractPipeline = (pipelineId: string, { pipelines }: Options) =>
  pipelineId && pipelines ? pipelines[pipelineId] : undefined // eslint-disable-line security/detect-object-injection

const removeFlip = ({ flip, ...state }: State) => state

export default function apply(pipelineId: string): Operation {
  return (options) => (next) => {
    const pipeline = extractPipeline(pipelineId, options)

    if (!pipeline) {
      const message = pipelineId
        ? `Failed to apply pipeline '${pipelineId}'. Unknown pipeline`
        : 'Failed to apply pipeline. No id provided'
      throw new Error(message)
    }

    const fn = pipeline
      ? defToOperation(pipeline)(options)(identity)
      : undefined
    return (state) => {
      const nextState = next(state)
      return fn ? fn(removeFlip(nextState)) : nextState
    }
  }
}
