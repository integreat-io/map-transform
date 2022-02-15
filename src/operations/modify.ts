import { Operation, MapDefinition } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'
import { isObject } from '../utils/is'

export default function modify(def: MapDefinition): Operation {
  const runFn = mapFunctionFromDef(def)
  return (options) => (state) => {
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
