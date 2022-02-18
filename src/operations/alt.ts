import { Operation, MapDefinition } from '../types'
import { setStateValue, getStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function alt(fn: MapDefinition): Operation {
  return (options) => {
    const runAlt = mapFunctionFromDef(fn)(options)

    return (state) =>
      getStateValue(state) === undefined
        ? runAlt(setStateValue(state, state.context))
        : state
  }
}
