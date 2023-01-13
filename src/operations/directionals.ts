import { MapDefinition, Operation, Options } from '../types.js'
import { operationFromDef } from '../utils/definitionHelpers.js'
import xor from '../utils/xor.js'

const applyInDirection = (def: MapDefinition, rev: boolean): Operation => {
  return (options: Options) => (next) => {
    const fn = operationFromDef(def)(options)(next)
    return (state) => (xor(rev, !state.rev) ? fn(state) : next(state))
  }
}

export function fwd(def: MapDefinition): Operation {
  return applyInDirection(def, false)
}

export function rev(def: MapDefinition): Operation {
  return applyInDirection(def, true)
}

export function divide(
  fwdDef: MapDefinition,
  revDef: MapDefinition
): Operation {
  return (options) => (next) => {
    const fwdFn = operationFromDef(fwdDef)(options)(next)
    const revFn = operationFromDef(revDef)(options)(next)
    return (state) => (state.rev ? revFn(state) : fwdFn(state))
  }
}
