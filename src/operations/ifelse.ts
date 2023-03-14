import { DataMapper, TransformDefinition, Operation } from '../types.js'
import { getStateValue, setStateValue } from '../utils/stateHelpers.js'
import { operationFromDef } from '../utils/definitionHelpers.js'
import { identity } from '../utils/functional.js'

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
  conditionDef: DataMapper | TransformDefinition,
  trueDef?: TransformDefinition,
  falseDef?: TransformDefinition
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
    const runCondition = conditionFn(options)(identity)
    const runTrue = trueFn(options)(identity)
    const runFalse = falseFn(options)(identity)

    return (state) => {
      const nextState = next(state)
      const bool = getStateValue(runCondition(nextState))
      return bool ? runTrue(nextState) : runFalse(nextState)
    }
  }
}
