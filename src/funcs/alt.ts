import { State, MapFunction, MapDefinition } from '../types'
import { setValueFromState } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function alt (fn: MapDefinition): MapFunction {
  const runAlt = mapFunctionFromDef(fn)

  return (state: State) => (typeof state.value === 'undefined')
    ? setValueFromState(
      state,
      runAlt({ ...state, value: state.context })
    )
    : state
}
