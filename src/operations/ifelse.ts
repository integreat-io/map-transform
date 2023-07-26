import type { DataMapper, TransformDefinition, Operation } from '../types.js'
import {
  getStateValue,
  setStateValue,
  goForward,
} from '../utils/stateHelpers.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'

function runCondition(conditionDef: DataMapper): Operation {
  return () => (next) => async (state) => {
    const nextState = await next(state)
    return setStateValue(
      nextState,
      await conditionDef(getStateValue(nextState), nextState)
    )
  }
}

export default function (
  conditionDef?: DataMapper | TransformDefinition,
  trueDef?: TransformDefinition,
  falseDef?: TransformDefinition
): Operation {
  return (options) => {
    const falseFn = defToOperation(falseDef, options)
    if (!conditionDef) {
      return falseFn(options)
    }
    const conditionFn: Operation =
      typeof conditionDef === 'function'
        ? runCondition(conditionDef as DataMapper) // We know to expect a datamapper here
        : defToOperation(conditionDef, options)
    const trueFn = defToOperation(trueDef, options)

    return (next) => {
      const runCondition = conditionFn(options)(noopNext)
      const runTrue = trueFn(options)(noopNext)
      const runFalse = falseFn(options)(noopNext)

      return async (state) => {
        const nextState = await next(state)
        const bool = getStateValue(await runCondition(goForward(nextState)))
        return bool ? await runTrue(nextState) : await runFalse(nextState)
      }
    }
  }
}
