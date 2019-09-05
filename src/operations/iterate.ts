import { compose } from 'ramda'
import mapAny = require('map-any')
import { Operation, State, Data, MapDefinition, Options } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const indexOfIfArray = (arr: unknown, index?: number) =>
  Array.isArray(arr) && typeof index === 'number' ? arr[index] : arr // eslint-disable-line security/detect-object-injection

const iterateWithContext = (
  state: State,
  value: Data,
  index: number | undefined
) => ({
  ...state,
  context: indexOfIfArray(state.context, index),
  value
})

export default function iterate(def: MapDefinition): Operation {
  return (options: Options) => {
    if (!def || (typeof def === 'object' && Object.keys(def).length === 0)) {
      return (state: State) => setStateValue(state, undefined)
    }
    const fn = compose(
      getStateValue,
      mapFunctionFromDef(def)(options),
      iterateWithContext
    )
    return (state: State): State =>
      setStateValue(
        state,
        mapAny((value, index) => fn(state, value, index), getStateValue(state))
      )
  }
}
