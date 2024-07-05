import type { Operation, TransformDefinition } from '../types.js'
import {
  getStateValue,
  setStateValue,
  getTargetFromState,
  goForward,
} from '../utils/stateHelpers.js'
import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import { isObject } from '../utils/is.js'
import { noopNext } from '../utils/stateHelpers.js'

export default function modify(def: TransformDefinition): Operation {
  return (options) => {
    const runFn = defToNextStateMapper(def, options)(noopNext)
    return (next) => async (state) => {
      const nextState = await next(state)
      const thisState = await runFn(goForward(nextState))

      const target = getTargetFromState(nextState)
      const value = getStateValue(thisState)

      return setStateValue(
        nextState,
        isObject(target) && isObject(value)
          ? { ...value, ...target }
          : isObject(value)
            ? value
            : target,
      )
    }
  }
}
