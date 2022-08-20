import { Operation, MapDefinition } from '../types'
import {
  getStateValue,
  setStateValue,
  getTargetFromState,
  removeLastContext,
} from '../utils/stateHelpers'
import { operationFromDef } from '../utils/definitionHelpers'
import { isObject } from '../utils/is'
import { identity } from '../utils/functional'

export default function modify(def: MapDefinition): Operation {
  const runFn = operationFromDef(def)

  return (options) => (next) => (state) => {
    const nextState = next(state)
    const contextState = removeLastContext(
      setStateValue(nextState, getTargetFromState(nextState))
    )
    const thisState = runFn(options)(identity)(contextState)

    const thisValue = getStateValue(thisState)
    const nextValue = getStateValue(nextState)

    return setStateValue(
      nextState,
      isObject(nextValue) && isObject(thisValue)
        ? { ...thisValue, ...nextValue }
        : nextValue
    )
  }
}
