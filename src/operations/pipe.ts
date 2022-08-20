import { MapPipe, Operation } from '../types'
import { operationsFromDef } from '../utils/definitionHelpers'
import { identity } from '../utils/functional'
import { compose as composeFn, pipe as pipeFn } from '../utils/functional'
import xor from '../utils/xor'

export default function pipe(defs: MapPipe): Operation {
  return (options) => {
    if (defs.length === 0) {
      return identity
    }

    const fns = defs
      .flat()
      .flatMap((def) => operationsFromDef(def))
      .map((fn) => fn(options))

    return (next) => {
      const run = pipeFn(...fns)(next)
      const runRev = composeFn(...fns)(next)
      return function doPipe(state) {
        const isRev = xor(state.rev, state.flip)
        return isRev ? runRev(state) : run(state)
      }
    }
  }
}
