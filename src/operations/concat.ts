import { Operation, TransformDefinition } from '../types.js'
import { setStateValue, getStateValue } from '../utils/stateHelpers.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import { identity } from '../utils/functional.js'

const merge = <T, U>(left: T[], right: U | U[]) =>
  Array.isArray(right) ? [...left, ...right] : [...left, right]

export default function concat(...defs: TransformDefinition[]): Operation {
  return (options) => (next) => {
    const fns = defs.map((def) => defToOperation(def)(options)(identity))

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
