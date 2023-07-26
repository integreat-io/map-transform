import type { Operation, TransformDefinition } from '../types.js'
import {
  getStateValue,
  setStateValue,
  getTargetFromState,
  goForward,
} from '../utils/stateHelpers.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import { isObject } from '../utils/is.js'
import { noopNext } from '../utils/stateHelpers.js'

export default function modify(def: TransformDefinition): Operation {
  return (options) => {
    const runFn = defToOperation(def, options)
    return (next) => async (state) => {
      const nextState = await next(state)
      const contextState = setStateValue(
        nextState,
        getTargetFromState(nextState)
      )
      const thisState = await runFn(options)(noopNext)(goForward(contextState))

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
}
