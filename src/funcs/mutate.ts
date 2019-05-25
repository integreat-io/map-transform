import * as mapAny from 'map-any'
import { Operation, State, MapDefinition, Options } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import objectToMapFunction from '../utils/objectToMapFunction'

export default function mutate (def: MapDefinition): Operation {
  return (options: Options) => {
    const runMutation = objectToMapFunction(def, options)

    return (state: State): State => (typeof state.value === 'undefined')
    ? state
    : setStateValue(
      state,
      mapAny(
        (value) => getStateValue(runMutation(setStateValue(state, value))),
        state.value
      )
    )
  }
}
