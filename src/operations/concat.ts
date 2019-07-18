import { State, Data, Prop, Operation, MapDefinition, Options } from '../types'
import { setStateValue, getStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const merge = (left: Prop[], right: Data) => (Array.isArray(right)) ? [...left, ...right] : [...left, right]

export default function concat (...defs: MapDefinition[]): Operation {
  return (options: Options) => {
    const fns = defs.map((def) => mapFunctionFromDef(def)(options))

    return (state: State) => setStateValue(
      state,
      fns
      .reduce((value, fn) => merge(value, getStateValue(fn(state))), [] as Prop[])
      .filter((val) => typeof val !== 'undefined')
    )
  }
}
