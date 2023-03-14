import { Operation, TransformDefinition } from '../types.js'
import {
  getStateValue,
  setStateValue,
  getTargetFromState,
  goForward,
} from '../utils/stateHelpers.js'
import { operationFromDef } from '../utils/definitionHelpers.js'
import { isObject } from '../utils/is.js'
import { identity } from '../utils/functional.js'

export default function modify(def: TransformDefinition): Operation {
  const runFn = operationFromDef(def)

  return (options) => (next) => (state) => {
    const nextState = next(state)
    const contextState = setStateValue(nextState, getTargetFromState(nextState))
    const thisState = runFn(options)(identity)(goForward(contextState))

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
