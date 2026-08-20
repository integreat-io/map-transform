import { noopNext } from '../utils/stateHelpers.js'
import { getPreparedPipeline } from '../utils/preparedPipelines.js'
import { toInternalOptions } from '../utils/internalOptions.js'
import type {
  InternalOptions,
  Operation,
  State,
  StateMapper,
  TransformDefinition,
} from '../types.js'

// Look up the pipeline definition, to verify that it exists. Note that we don't
// resolve it to an operation here, as that's done when the pipeline is run.
const getPipelineDef = (
  pipelineId: string | symbol,
  pipelines: Record<string | symbol, TransformDefinition>,
) =>
  (typeof pipelineId === 'string' || typeof pipelineId === 'symbol') &&
  pipelines
    ? pipelines[pipelineId] // eslint-disable-line security/detect-object-injection
    : undefined

const removeFlip = ({ flip, ...state }: State) => state

const createApplyFn =
  (next: StateMapper, options: InternalOptions, pipelineId: string | symbol) =>
  async (state: State) => {
    // Fetch the prepared pipeline. It will be resolved to an operation and
    // cached the first time it's needed.
    const fn: Operation | undefined = getPreparedPipeline(pipelineId, options)
    if (typeof fn !== 'function') {
      throw new Error(`Unknown pipeline '${String(pipelineId)}'.`)
    }
    const nextState = await next(state)
    return fn(options)(noopNext)(removeFlip(nextState))
  }

export default function apply(pipelineId: string | symbol): Operation {
  return (options) => {
    const pipelines = options.pipelines
    if (!pipelines) {
      throw new Error(
        `Failed to apply pipeline '${String(pipelineId)}'. No pipelines`,
      )
    }
    const pipeline = getPipelineDef(pipelineId, pipelines)
    if (!pipeline) {
      const message = pipelineId
        ? `Failed to apply pipeline '${String(pipelineId)}'. Unknown pipeline`
        : 'Failed to apply pipeline. No id provided'
      throw new Error(message)
    }
    // Register this pipeline id as needed, to tell map-transform which
    // pipelines to resolve into operations. All others are left alone.
    const internalOptions = toInternalOptions(options)
    internalOptions.neededPipelineIds.add(pipelineId)

    return (next) => {
      return createApplyFn(next, internalOptions, pipelineId)
    }
  }
}
