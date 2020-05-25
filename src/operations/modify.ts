import { Operation, State, MapDefinition, Options } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'
import { isObject } from '../utils/is'

export default function merge(def: MapDefinition): Operation {
  const runFn = mapFunctionFromDef(def)
  return (options: Options) => (state: State): State => {
    const nextState = runFn(options)(state)

    const prevValue = getStateValue(state)
    const nextValue = getStateValue(nextState)

    return setStateValue(
      state,
      isObject(prevValue) && isObject(nextValue)
        ? { ...prevValue, ...nextValue }
        : nextValue
    )
  }
}
