import { DataMapper, MapDefinition, Operation, State } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function (
  conditionDef: DataMapper | MapDefinition,
  trueDef?: MapDefinition,
  falseDef?: MapDefinition
): Operation {
  const falseFn = mapFunctionFromDef(falseDef)
  if (!conditionDef) {
    return falseFn
  }
  const conditionFn: Operation =
    typeof conditionDef === 'function'
      ? () =>
          (state: State): State =>
            setStateValue(
              state,
              (conditionDef as DataMapper)(getStateValue(state), state)
            )
      : mapFunctionFromDef(conditionDef)
  const trueFn = mapFunctionFromDef(trueDef)

  return (options) => {
    const runCondition = conditionFn(options)
    const runTrue = trueFn(options)
    const runFalse = falseFn(options)

    return (state) => {
      const bool = getStateValue(runCondition(state))
      return bool ? runTrue(state) : runFalse(state)
    }
  }
}
