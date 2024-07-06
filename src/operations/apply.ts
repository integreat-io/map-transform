import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'
import type {
  Options,
  Operation,
  State,
  TransformDefinition,
  StateMapper,
} from '../types.js'

// TODO: use a Map instead of an object, and prepare the pipelines when the
// options is hande to MapTransform instead of here.

const getPipeline = (pipelineId: string | symbol, { pipelines }: Options) =>
  (typeof pipelineId === 'string' || typeof pipelineId === 'symbol') &&
  pipelines
    ? pipelines[pipelineId] // eslint-disable-line security/detect-object-injection
    : undefined

function setPipeline(
  id: string | symbol,
  operation: Operation,
  options: Options,
) {
  if (options.pipelines) {
    options.pipelines[id] = operation // eslint-disable-line security/detect-object-injection
  }
}

const removeFlip = ({ flip, ...state }: State) => state

// If this is not an operation (function), we convert it to an operation and
// then set it back on `pipelines`. This is done to allow for recursive
// pipelines and works because as soon as it is set as an operation, it won't be
// touched again until it is used in the "next" phase.
function prepareAndSetPipeline(
  pipelineId: string | symbol,
  pipeline: TransformDefinition,
  options: Options,
) {
  if (typeof pipeline !== 'function' && pipeline) {
    setPipeline(pipelineId, () => () => noopNext, options) // Set an empty operation to tell any `apply()` calls further down, that we are taking care of this pipeline
    const nextStateMapper = defToNextStateMapper(pipeline, options)
    setPipeline(pipelineId, () => nextStateMapper, options) // Set the actual operation
  }
}

const createApplyFn =
  (next: StateMapper, fn?: StateMapper) => async (state: State) => {
    const nextState = await next(state)
    return fn ? fn(removeFlip(nextState)) : nextState
  }

export default function apply(pipelineId: string | symbol): Operation {
  return (options) => {
    const pipeline = getPipeline(pipelineId, options)
    if (!pipeline) {
      const message = pipelineId
        ? `Failed to apply pipeline '${String(pipelineId)}'. Unknown pipeline`
        : 'Failed to apply pipeline. No id provided'
      throw new Error(message)
    }

    prepareAndSetPipeline(pipelineId, pipeline, options)

    return (next) => {
      // Fetch the prepared operation, and start the "next" phase.
      const operation = getPipeline(pipelineId, options)
      const fn =
        typeof operation === 'function'
          ? operation(options)(noopNext)
          : undefined
      if (fn) {
        // Set the next-ed operation back, so this won't be done in every
        // location we use the pipeline. It will still apply options and next to
        // the operation we set here, but it won't actually do anything.
        setPipeline(pipelineId, () => () => fn, options)
      }

      return createApplyFn(next, fn)
    }
  }
}
