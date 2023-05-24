import pipe from './pipe.js'
import {
  setStateValue,
  getLastContext,
  isNonvalueState,
  setValueFromState,
  removeLastContext,
} from '../utils/stateHelpers.js'
import { defToOperations } from '../utils/definitionHelpers.js'
import { identity } from '../utils/functional.js'
import type { Operation, TransformDefinition } from '../types.js'

const runAlt = (isOneMode: boolean) =>
  function runAlt(operation: Operation, index: number): Operation {
    return (options) => (next) => (state) => {
      const nextState = next(state)
      const { nonvalues } = options
      const isFirst = !isOneMode && index === 0

      if (isFirst) {
        const thisState = operation(options)(identity)(nextState)
        return isNonvalueState(thisState, nonvalues)
          ? { ...thisState, context: [...nextState.context, nextState.value] }
          : thisState
      } else {
        if (isNonvalueState(nextState, nonvalues)) {
          const thisState = operation(options)(identity)(
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

export default function alt(...defs: TransformDefinition[]): Operation[] {
  // Prepare all alt operations
  const altOperations = defs
    .map((def) => defToOperations(def))
    .map((def) => (Array.isArray(def) ? pipe(def, true) : def)) // We insert into pipe here when necessary, to specify that the pipe should return context
  const isOneMode = altOperations.length === 1

  // All alt operations are returned as individual operations, but the first one
  // is run in isolation (if it returns undefined, it will not polute the
  // context) and the rest are run only if the state value is not set
  return altOperations.map(runAlt(isOneMode))
}
