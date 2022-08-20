import { DataMapper, MapDefinition, Operation } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { operationFromDef } from '../utils/definitionHelpers'

function runCondition(conditionDef: DataMapper): Operation {
  return () => (next) => (state) => {
    const nextState = next(state)
    return setStateValue(
      nextState,
      conditionDef(getStateValue(nextState), nextState)
    )
  }
}

export default function (
  conditionDef: DataMapper | MapDefinition,
  trueDef?: MapDefinition,
  falseDef?: MapDefinition
): Operation {
  const falseFn = operationFromDef(falseDef)
  if (!conditionDef) {
    return falseFn
  }
  const conditionFn: Operation =
    typeof conditionDef === 'function'
      ? runCondition(conditionDef as DataMapper) // We know to expect a datamapper here
      : operationFromDef(conditionDef)
  const trueFn = operationFromDef(trueDef)

  return (options) => (next) => {
    const runCondition = conditionFn(options)(next)
    const runTrue = trueFn(options)(next)
    const runFalse = falseFn(options)(next)

    return (state) => {
      const bool = getStateValue(runCondition(state))
      return bool ? runTrue(state) : runFalse(state)
    }
  }
}
