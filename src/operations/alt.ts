import pipe from './pipe.js'
import {
  setValueFromState,
  popContext,
  isNonvalueState,
  setStateValue,
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

// Check if the state value of the afterState is the same as the beforeState.
// We do a strict comparison here, and not a deep equal, as the `fwd` and `rev`
// operations returns the state untouched when it is skipped.
const isUntouched = (afterState: State, beforeState: State) =>
  beforeState.value === afterState.value

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
async function runAltOperation(operation: StateMapper, state: State) {
  const afterState = await operation(state)
  return isUntouched(afterState, state)
    ? setStateValue(afterState, undefined)
    : afterState
}

function createOneAltOperation(
  def: TransformDefinition,
  index: number,
  hasOnlyOneAlt: boolean
): Operation {
  return (options) => {
    const operation = pipeIfArray(defToOperations(def, options))(options)(
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
      const afterState = await runAltOperation(operation, beforeState)
      return isNonvalueState(afterState, nonvalues)
        ? setValueFromState(nextState, afterState, isFirst) // We push the context for the first alt operation
        : afterState
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
    createOneAltOperation(def, index, hasOnlyOneAlt)
  )
}
