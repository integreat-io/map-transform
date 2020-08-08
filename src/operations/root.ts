import { MapDefinition, Operation } from '../types'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function (def: MapDefinition): Operation {
  return (options) => {
    const pipeline = mapFunctionFromDef(def)(options)

    return (state) => pipeline({ ...state, value: state.root })
  }
}
