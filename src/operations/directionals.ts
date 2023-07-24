import type { TransformDefinition, Operation, Options } from '../types.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import xor from '../utils/xor.js'

const applyInDirection = (
  def: TransformDefinition,
  rev: boolean
): Operation => {
  return (options: Options) => (next) => {
    const fn = defToOperation(def, options)(options)(next)
    return (state) => (xor(rev, !state.rev) ? fn(state) : next(state))
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
  revDef: TransformDefinition
): Operation {
  return (options) => (next) => {
    const fwdFn = defToOperation(fwdDef, options)(options)(next)
    const revFn = defToOperation(revDef, options)(options)(next)
    return (state) => (state.rev ? revFn(state) : fwdFn(state))
  }
}
