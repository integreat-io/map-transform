import type { Options, Operation, State } from '../types.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'

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
  options: Options
) {
  if (options.pipelines) {
    options.pipelines[id] = operation // eslint-disable-line security/detect-object-injection
  }
}

const removeFlip = ({ flip, ...state }: State) => state

export default function apply(pipelineId: string | symbol): Operation {
  return (options) => {
    const pipeline = getPipeline(pipelineId, options)

    if (!pipeline) {
      const message = pipelineId
        ? `Failed to apply pipeline '${String(pipelineId)}'. Unknown pipeline`
        : 'Failed to apply pipeline. No id provided'
      throw new Error(message)
    }

    // If this is not an operation, but it's something, then it's a definition.
    // We convert it to an operation, and then set it back on `pipelines`, to be
    // fetched in the next phase. This is done to allow for recursive pipelines
    // and works before each pipeline is only prepared once by the first
    // `apply()` to find it.
    if (typeof pipeline !== 'function' && pipeline) {
      setPipeline(pipelineId, () => () => noopNext, options) // Set an empty operation to tell any `apply()` calls further down, that we are taking care of this pipeline
      const operation = defToOperation(pipeline, options)(options)
      setPipeline(pipelineId, () => operation, options) // Set the actual operation
    }

    return (next) => {
      // Fetch the actual operation, and start the "next" phase.
      const operation = getPipeline(pipelineId, options)
      const fn =
        typeof operation === 'function'
          ? operation(options)(noopNext)
          : undefined
      if (fn) {
        setPipeline(pipelineId, () => () => fn, options) // Set the next-ed operation back, so it won't be done in every location we use the pipeline
      }

      return async (state) => {
        const nextState = await next(state)
        return fn ? fn(removeFlip(nextState)) : nextState
      }
    }
  }
}
