import { defToOperation } from '../utils/definitionHelpers.js'
import { revFromState } from '../utils/stateHelpers.js'
import type { TransformDefinition, Operation, Options } from '../types.js'

const applyInDirection =
  (def: TransformDefinition, rev: boolean): Operation =>
  (options: Options) =>
  (next) => {
    const fn = defToOperation(def, options)(options)(next)
    return async (state) =>
      revFromState(state, !rev) ? await fn(state) : await next(state)
  }

export function fwd(def: TransformDefinition): Operation {
  return applyInDirection(def, false)
}

export function rev(def: TransformDefinition): Operation {
  return applyInDirection(def, true)
}

export function divide(
  fwdDef: TransformDefinition,
  revDef: TransformDefinition
): Operation {
  return (options) => (next) => {
    const fwdFn = defToOperation(fwdDef, options)(options)(next)
    const revFn = defToOperation(revDef, options)(options)(next)
    return async (state) =>
      state.rev ? await revFn(state) : await fwdFn(state)
  }
}
