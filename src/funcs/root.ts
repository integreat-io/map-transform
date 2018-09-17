import { MapDefinition, MapFunction } from '../types'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function (def: MapDefinition): MapFunction {
  const pipeline = mapFunctionFromDef(def)

  return (state) => pipeline({ ...state, value: state.root })
}
