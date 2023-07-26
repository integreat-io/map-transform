import type { Operation, TransformDefinition } from '../types.js'
import { setStateValue, getStateValue } from '../utils/stateHelpers.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'

const merge = <T, U>(left: T[], right: U | U[]) =>
  Array.isArray(right) ? [...left, ...right] : [...left, right]

export default function concat(...defs: TransformDefinition[]): Operation {
  return (options) => (next) => {
    const fns = defs.map((def) =>
      defToOperation(def, options)(options)(noopNext)
    )

    return async function doConcat(state) {
      const nextState = await next(state)

      let nextValue: unknown[] = []
      for (const fn of fns) {
        const value = getStateValue(await fn(nextState))
        nextValue = merge(nextValue, value)
      }

      return setStateValue(
        nextState,
        nextValue.filter((val) => val !== undefined)
      )
    }
  }
}
