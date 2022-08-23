import { Operation, MapDefinition } from '../types'
import {
  setStateValue,
  getStateValue,
  getLastContext,
  removeLastContext,
} from '../utils/stateHelpers'
import { operationFromDef } from '../utils/definitionHelpers'
import { identity } from '../utils/functional'

const isNoValue = (value: unknown, noneValues: unknown[]) =>
  noneValues.includes(value)

function runAlt(operation: Operation, index: number): Operation {
  return (options) => (next) => (state) => {
    const nextState = next(state)
    const { noneValues = [undefined] } = options
    const isFirst = index === 0

    if (isFirst) {
      const thisState = operation(options)(identity)(nextState)
      return isNoValue(getStateValue(thisState), noneValues)
        ? { ...thisState, context: [...nextState.context, nextState.value] }
        : thisState
    } else {
      if (isNoValue(getStateValue(nextState), noneValues)) {
        return operation(options)(identity)(
          removeLastContext(setStateValue(nextState, getLastContext(nextState)))
        )
      } else {
        return nextState
      }
    }
  }
}

export default function alt(...defs: MapDefinition[]): Operation[] {
  // Prepare all alt operations
  const altOperations = defs.map((def) => operationFromDef(def))

  // All alt operations are returned as individual operations, but the first one
  // is run in isolation (if it returns undefined, it will not polute the
  // context) and the rest are run only if the state value is not set
  return altOperations.map(runAlt)
}

//   return function doAlt(state) {
//     const nextState = next(state)

//     return altOperations.reduce(
//       (prevState, operation) =>
//         isNoValue(getStateValue(prevState), noneValues)
//           ? operation(nextState)
//           : prevState,
//       setStateValue(nextState, undefined)
//     )
//   }
// }
