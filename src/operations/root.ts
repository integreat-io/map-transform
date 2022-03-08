import { MapDefinition, Operation, State } from '../types'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const valueFromRoot = (state: State) => ({ ...state, value: state.root })

export default function (def: MapDefinition): Operation {
  return (options) => {
    const pipeline = mapFunctionFromDef(def)(options)

    return (state) => pipeline(valueFromRoot(state))
  }
}
