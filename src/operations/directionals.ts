import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import type { TransformDefinition, Operation, Options } from '../types.js'
import { revFromState } from '../utils/stateHelpers.js'

const applyInDirection =
  (def: TransformDefinition, shouldRunRev: boolean): Operation =>
  (options: Options) =>
  (next) => {
    const fn = defToNextStateMapper(def, options)(next)
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
  honorFlip = false,
): Operation {
  return (options) => (next) => {
    const fwdFn = defToNextStateMapper(fwdDef, options)(next)
    const revFn = defToNextStateMapper(revDef, options)(next)
    return async function applyDivide(state) {
      const isRev = honorFlip ? revFromState(state) : !!state.rev
      return isRev ? await revFn(state) : await fwdFn(state)
    }
  }
}
