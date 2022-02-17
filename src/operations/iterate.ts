import mapAny = require('map-any')
import { Operation, MapDefinition } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const indexOfIfArray = (arr: unknown, index?: number) =>
  Array.isArray(arr) && typeof index === 'number' ? arr[index] : arr // eslint-disable-line security/detect-object-injection

export default function iterate(def: MapDefinition): Operation {
  return (options) => {
    if (!def || (typeof def === 'object' && Object.keys(def).length === 0)) {
      return (state) => setStateValue(state, undefined)
    }
    const fn = mapFunctionFromDef(def)(options)

    return (state) =>
      setStateValue(
        state,
        mapAny(
          (value, index) =>
            getStateValue(
              fn({
                ...state,
                context: indexOfIfArray(state.context, index),
                value,
              })
            ),
          getStateValue(state)
        )
      )
  }
}
