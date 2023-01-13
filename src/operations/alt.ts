import { Operation, MapDefinition } from '../types.js'
import {
  setStateValue,
  getLastContext,
  isNoneValueState,
  setValueFromState,
  removeLastContext,
} from '../utils/stateHelpers.js'
import { operationFromDef } from '../utils/definitionHelpers.js'
import { identity } from '../utils/functional.js'

const runAlt = (isOneMode: boolean) =>
  function runAlt(operation: Operation, index: number): Operation {
    return (options) => (next) => (state) => {
      const nextState = next(state)
      const { noneValues } = options
      const isFirst = !isOneMode && index === 0

      if (isFirst) {
        const thisState = operation(options)(identity)(nextState)
        return isNoneValueState(thisState, noneValues)
          ? { ...thisState, context: [...nextState.context, nextState.value] }
          : thisState
      } else {
        if (isNoneValueState(nextState, noneValues)) {
          const thisState = operation(options)(identity)(
            removeLastContext(
              setStateValue(nextState, getLastContext(nextState))
            )
          )
          return isNoneValueState(thisState, noneValues)
            ? setValueFromState(nextState, thisState)
            : thisState
        } else {
          return nextState
        }
      }
    }
  }

export default function alt(...defs: MapDefinition[]): Operation[] {
  // Prepare all alt operations
  const altOperations = defs.map((def) => operationFromDef(def))
  const isOneMode = altOperations.length === 1

  // All alt operations are returned as individual operations, but the first one
  // is run in isolation (if it returns undefined, it will not polute the
  // context) and the rest are run only if the state value is not set
  return altOperations.map(runAlt(isOneMode))
}
