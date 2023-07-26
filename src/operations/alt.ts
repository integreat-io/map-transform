import pipe from './pipe.js'
import {
  setStateValue,
  getLastContext,
  isNonvalueState,
  setValueFromState,
  removeLastContext,
} from '../utils/stateHelpers.js'
import { defToOperations } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'
import type { Operation, TransformDefinition } from '../types.js'

// We run an array of operations through a pipe here when necessary, and specify
// that the pipe should return context
const pipeIfArray = (def: Operation | Operation[]) =>
  Array.isArray(def) ? pipe(def, true) : def

function createOneAltOperation(
  def: TransformDefinition,
  index: number,
  isSingleMode: boolean
): Operation {
  return (options) => {
    // Prepare alt operation
    const operation = pipeIfArray(defToOperations(def, options))

    return (next) => async (state) => {
      const nextState = await next(state)
      const { nonvalues } = options
      const isFirst = !isSingleMode && index === 0

      if (isFirst) {
        const thisState = await operation(options)(noopNext)(nextState)
        return isNonvalueState(thisState, nonvalues)
          ? { ...thisState, context: [...nextState.context, nextState.value] }
          : thisState
      } else {
        if (isNonvalueState(nextState, nonvalues)) {
          const thisState = await operation(options)(noopNext)(
            removeLastContext(
              setStateValue(nextState, getLastContext(nextState))
            )
          )
          return isNonvalueState(thisState, nonvalues)
            ? setValueFromState(nextState, thisState)
            : thisState
        } else {
          return nextState
        }
      }
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
  const isSingleMode = defs.length === 1
  return defs.map((def, index) =>
    createOneAltOperation(def, index, isSingleMode)
  )
}
