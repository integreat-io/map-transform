import { Data, Operation, MapDefinition } from '../types'
import { setStateValue, getStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const merge = (left: Data[], right: Data) =>
  Array.isArray(right) ? [...left, ...right] : [...left, right]

export default function concat(...defs: MapDefinition[]): Operation {
  return (options) => {
    const fns = defs.map((def) => mapFunctionFromDef(def)(options))

    return (state) =>
      setStateValue(
        state,
        fns
          .reduce(
            (value, fn) => merge(value, getStateValue(fn(state))),
            [] as Data[]
          )
          .filter((val) => typeof val !== 'undefined')
      )
  }
}
