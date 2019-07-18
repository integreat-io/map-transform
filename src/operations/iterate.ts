import { compose } from 'ramda'
import mapAny = require('map-any')
import { Operation, State, MapDefinition, Options } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function iterate(def: MapDefinition): Operation {
  return (options: Options) => {
    if (!def || (typeof def === 'object' && Object.keys(def).length === 0)) {
      return (state: State) => setStateValue(state, undefined)
    }
    const fn = compose(
      getStateValue,
      mapFunctionFromDef(def, options),
      setStateValue
    )
    return (state: State): State =>
      setStateValue(
        state,
        mapAny(value => fn(state, value), getStateValue(state))
      )
  }
}
