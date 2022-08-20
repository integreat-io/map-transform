import { Operation, MapDefinition } from '../types'
import { setStateValue, getStateValue } from '../utils/stateHelpers'
import { operationFromDef } from '../utils/definitionHelpers'
import { identity } from '../utils/functional'

const merge = <T, U>(left: T[], right: U | U[]) =>
  Array.isArray(right) ? [...left, ...right] : [...left, right]

export default function concat(...defs: MapDefinition[]): Operation {
  return (options) => (next) => {
    const fns = defs.map((def) => operationFromDef(def)(options)(identity))

    return function doConcat(state) {
      const nextState = next(state)
      return setStateValue(
        nextState,
        fns
          .reduce(
            (value, fn) => merge(value, getStateValue(fn(nextState))),
            [] as unknown[]
          )
          .filter((val) => val !== undefined)
      )
    }
  }
}
