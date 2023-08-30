import { defToOperation } from '../utils/definitionHelpers.js'
import type { TransformDefinition, Operation, Options } from '../types.js'
import { revFromState } from '../utils/stateHelpers.js'

const applyInDirection =
  (def: TransformDefinition, shouldRunRev: boolean): Operation =>
  (options: Options) =>
  (next) => {
    const fn = defToOperation(def, options)(options)(next)
    return async function applyFwdOrRev(state) {
      return !!state.rev === shouldRunRev ? await fn(state) : await next(state)
    }
  }

export function fwd(def: TransformDefinition): Operation {
  return applyInDirection(def, false)
}

export function rev(def: TransformDefinition): Operation {
  return applyInDirection(def, true)
}

export function divide(
  fwdDef: TransformDefinition,
  revDef: TransformDefinition,
  honorFlip = false
): Operation {
  return (options) => (next) => {
    const fwdFn = defToOperation(fwdDef, options)(options)(next)
    const revFn = defToOperation(revDef, options)(options)(next)
    return async function applyDivide(state) {
      const isRev = honorFlip ? revFromState(state) : !!state.rev
      return isRev ? await revFn(state) : await fwdFn(state)
    }
  }
}
