import { noopNext } from '../utils/stateHelpers.js'
import type {
  Options,
  Operation,
  State,
  StateMapper,
  TransformDefinition,
} from '../types.js'

const getPipeline = (
  pipelineId: string | symbol,
  pipelines: Record<string | symbol, TransformDefinition>,
) =>
  (typeof pipelineId === 'string' || typeof pipelineId === 'symbol') &&
  pipelines
    ? pipelines[pipelineId] // eslint-disable-line security/detect-object-injection
    : undefined

const removeFlip = ({ flip, ...state }: State) => state

// Register this pipeline id as needed on the options. This will tell
// map-transform which pipelines to resolve into operations. All other pipelines
// are removed.
function markPipelineAsNeeded(pipelineId: string | symbol, options: Options) {
  if (!options.neededPipelineIds) {
    // There is not `Set` yet -- create it
    options.neededPipelineIds = new Set<string | symbol>()
  }
  options.neededPipelineIds.add(pipelineId)
}

const createApplyFn =
  (
    next: StateMapper,
    pipelines: Record<string | symbol, TransformDefinition>,
    pipelineId: string | symbol,
  ) =>
  async (state: State) => {
    const fn = getPipeline(pipelineId, pipelines)
    if (typeof fn !== 'function') {
      throw new Error(`Unknown pipeline '${String(pipelineId)}'.`)
    }
    const nextState = await next(state)
    return fn ? fn({})(noopNext)(removeFlip(nextState)) : nextState
  }

export default function apply(pipelineId: string | symbol): Operation {
  return (options) => {
    const pipelines = options.pipelines
    if (!pipelines) {
      throw new Error(
        `Failed to apply pipeline '${String(pipelineId)}'. No pipelines`,
      )
    }
    const pipeline = getPipeline(pipelineId, pipelines)
    if (!pipeline) {
      const message = pipelineId
        ? `Failed to apply pipeline '${String(pipelineId)}'. Unknown pipeline`
        : 'Failed to apply pipeline. No id provided'
      throw new Error(message)
    }
    markPipelineAsNeeded(pipelineId, options)

    return (next) => {
      return createApplyFn(next, pipelines, pipelineId)
    }
  }
}
