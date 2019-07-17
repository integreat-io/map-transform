import { MapDefinition, Operation, Options } from '../types'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const applyInDirection = (def: MapDefinition, rev: boolean): Operation => {
  return (options: Options) => {
    const fn = mapFunctionFromDef(def, options)
    return (state) => (rev ? state.rev : !state.rev) ? fn(state) : state
  }
}

export function fwd (def: MapDefinition): Operation {
  return applyInDirection(def, false)
}

export function rev (def: MapDefinition): Operation {
  return applyInDirection(def, true)
}

export function divide (fwdDef: MapDefinition, revDef: MapDefinition): Operation {
  return (options: Options) => {
    const fwdFn = mapFunctionFromDef(fwdDef, options)
    const revFn = mapFunctionFromDef(revDef, options)
    return (state) => (state.rev) ? revFn(state) : fwdFn(state)
  }
}
