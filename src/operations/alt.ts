import {
  State,
  Operation,
  MapDefinition,
  Options
} from '../types'
import { setStateValue, getStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function alt(fn: MapDefinition): Operation {
  return (options: Options) => {
    const runAlt = mapFunctionFromDef(fn)(options)

    return (state: State) =>
      typeof getStateValue(state) === 'undefined'
        ? runAlt(setStateValue(state, state.context))
        : state
  }
}
