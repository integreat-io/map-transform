import { DataMapper, MapDefinition, Operation } from '../types'
import { getStateValue, contextFromState } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function (
  fn: DataMapper,
  trueDef?: MapDefinition,
  falseDef?: MapDefinition
): Operation {
  const falseFn = mapFunctionFromDef(falseDef)
  if (typeof fn !== 'function') {
    return falseFn
  }
  const trueFn = mapFunctionFromDef(trueDef)

  return (options) => {
    const runTrue = trueFn(options)
    const runFalse = falseFn(options)

    return (state) =>
      fn(getStateValue(state), contextFromState(state))
        ? runTrue(state)
        : runFalse(state)
  }
}
