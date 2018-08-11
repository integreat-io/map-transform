import * as mapAny from 'map-any'
import { MapFunction, State, MapDefinition } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import objectToMapFunction from '../utils/objectToMapFunction'

export default function mutate (def: MapDefinition): MapFunction {
  const runMutation = objectToMapFunction(def)

  return (state: State): State => setStateValue(
    state,
    mapAny(
      (value) => getStateValue(runMutation(setStateValue(state, value))),
      state.value
    )
  )
}
