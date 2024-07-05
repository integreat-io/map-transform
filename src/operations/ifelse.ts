import {
  getStateValue,
  setStateValue,
  goForward,
} from '../utils/stateHelpers.js'
import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'
import type {
  DataMapper,
  TransformDefinition,
  Operation,
  StateMapper,
} from '../types.js'

function runCondition(conditionDef: DataMapper): StateMapper {
  return async (state) => {
    return setStateValue(state, await conditionDef(getStateValue(state), state))
  }
}

export default function (
  conditionDef?: DataMapper | TransformDefinition,
  trueDef?: TransformDefinition,
  falseDef?: TransformDefinition,
): Operation {
  return (options) => {
    if (!conditionDef) {
      return defToNextStateMapper(falseDef, options)
    }
    const conditionFn: StateMapper =
      typeof conditionDef === 'function'
        ? runCondition(conditionDef as DataMapper) // We know to expect a datamapper here
        : defToNextStateMapper(conditionDef, options)(noopNext)
    const falseFn = defToNextStateMapper(falseDef, options)(noopNext)
    const trueFn = defToNextStateMapper(trueDef, options)(noopNext)

    return (next) => {
      return async (state) => {
        const nextState = await next(state)
        const bool = getStateValue(await conditionFn(goForward(nextState)))
        return bool ? await trueFn(nextState) : await falseFn(nextState)
      }
    }
  }
}
