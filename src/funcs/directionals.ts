import { MapDefinition, MapFunction } from '../types'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const applyInDirection = (def: MapDefinition, rev: boolean): MapFunction => {
  const fn = mapFunctionFromDef(def)
  return (state) => (rev ? state.rev : !state.rev) ? fn(state) : state
}
export function fwd (def: MapDefinition): MapFunction {
  return applyInDirection(def, false)
}

export function rev (def: MapDefinition): MapFunction {
  return applyInDirection(def, true)
}

export function divide (fwdDef: MapFunction, revDef: MapFunction): MapFunction {
  const fwdFn = mapFunctionFromDef(fwdDef)
  const revFn = mapFunctionFromDef(revDef)
  return (state) => (state.rev) ? revFn(state) : fwdFn(state)
}
