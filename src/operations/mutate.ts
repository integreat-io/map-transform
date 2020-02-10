import mapAny = require('map-any')
import { Operation, State, MapObject, Options } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import objectToMapFunction from '../utils/objectToMapFunction'

export default function mutate(def: MapObject): Operation {
  return (options: Options) => {
    const runMutation = objectToMapFunction(def, options)

    return (state: State): State =>
      state.value === undefined
        ? state
        : setStateValue(
            state,
            mapAny(
              value => getStateValue(runMutation(setStateValue(state, value))),
              state.value
            )
          )
  }
}
