import { MapDefinition, Operation, Options } from '../types'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function (def: MapDefinition): Operation {
  return (options: Options) => {
    const pipeline = mapFunctionFromDef(def, options)

    return (state) => pipeline({ ...state, value: state.root })
  }
}
