import pipe from './pipe.js'
import {
  setValueFromState,
  popContext,
  isNonvalueState,
  setStateValue,
  markAsUntouched,
  isUntouched,
} from '../utils/stateHelpers.js'
import { defToOperations } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'
import type {
  Operation,
  State,
  StateMapper,
  TransformDefinition,
} from '../types.js'

// We run an array of operations through a pipe here when necessary, and specify
// that the pipe should return context
const pipeIfArray = (def: Operation | Operation[]) =>
  Array.isArray(def) ? pipe(def, true) : def

// Run the pipeline and return the value. If the state value has not been
// changed by the alt pipeline, we set it to undefined to correct the case where
// the alt pipeline is wrapped in `fwd` or `rev`, as these will simply return
// the state untouched when we move in the wrong direction. We don't want the
// untouched pipeline here, as a skipped pipeline should be treated as if it
// returned a nonvalue.
//
// Note that we're just checking that the values are the exact same here, which
// may not be work in all cases. E.g. the pipeline `'.'` would be considered
// untouched, even though it is not wrapped in a directional, but again, what
// would be the use of having a pipeline that just returns the state untouched
// in an alt operation?
async function runAltPipeline(pipeline: StateMapper, state: State) {
  const afterState = await pipeline(markAsUntouched(state))
  return isUntouched(afterState)
    ? setStateValue(afterState, undefined)
    : afterState
}

// Prepare the pipeline and return an operation that will run it if the state
// value is a nonvalue or if this is the first of several alt pipelines.
//
// The way we push and pop context might seem a bit strange, but the logic is
// that if the first alt pipeline returns a nonvalue, the pushed context makes
// the original value available to the following pipelines. Also, if all return
// nonvalues, it is correct that we have moved one level down and need to go up
// again to get the value from before the alt operation.
function createOneAltPipeline(
  def: TransformDefinition,
  index: number,
  hasOnlyOneAlt: boolean
): Operation {
  return (options) => {
    const pipeline = pipeIfArray(defToOperations(def, options))(options)(
      noopNext
    )
    const isFirst = !hasOnlyOneAlt && index === 0
    const { nonvalues } = options

    return (next: StateMapper) => async (state: State) => {
      const nextState = await next(state)
      if (!isFirst && !isNonvalueState(nextState, nonvalues)) {
        // We already have a value, so we don't need to run the alt operation
        return nextState
      }

      // For all alts after the first, we remove the context pushed from the
      // first and provides it as the value.
      const beforeState = isFirst ? nextState : popContext(nextState)

      // Run operation and set value if it is not a nonvalue
      const afterState = await runAltPipeline(pipeline, beforeState)
      return isNonvalueState(afterState, nonvalues)
        ? setValueFromState(nextState, afterState, isFirst) // We got a non-value, so set it on the original state
        : afterState // We got a value, so return it
    }
  }
}

/**
 * All alt operations are returned as individual operations, but the first one
 * is run in isolation (if it returns undefined, it will not polute the context)
 * and the rest are run only if the state value is not set. The exception is
 * when there is only one alt operation, in which case it is run as if it was
 * not the first (the "first" is the value already in the pipeline).
 */
export default function alt(...defs: TransformDefinition[]): Operation[] {
  const hasOnlyOneAlt = defs.length === 1
  return defs.map((def, index) =>
    createOneAltPipeline(def, index, hasOnlyOneAlt)
  )
}
