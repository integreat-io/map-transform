import type { Options, Operation, State } from '../types.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'

const extractPipeline = (pipelineId: string | symbol, { pipelines }: Options) =>
  (typeof pipelineId === 'string' || typeof pipelineId === 'symbol') &&
  pipelines
    ? pipelines[pipelineId] // eslint-disable-line security/detect-object-injection
    : undefined

const removeFlip = ({ flip, ...state }: State) => state

export default function apply(pipelineId: string | symbol): Operation {
  return (options) => (next) => {
    const pipeline = extractPipeline(pipelineId, options)

    if (!pipeline) {
      const message = pipelineId
        ? `Failed to apply pipeline '${String(pipelineId)}'. Unknown pipeline`
        : 'Failed to apply pipeline. No id provided'
      throw new Error(message)
    }

    const fn = pipeline
      ? defToOperation(pipeline, options)(options)(noopNext)
      : undefined
    return async (state) => {
      const nextState = await next(state)
      return fn ? fn(removeFlip(nextState)) : nextState
    }
  }
}
