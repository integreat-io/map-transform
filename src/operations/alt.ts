import mapAny = require('map-any')
import {
  State,
  Data,
  Operation,
  StateMapper,
  MapDefinition,
  Options
} from '../types'
import { setStateValue, getStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const getOne = (context: Data | Data[], index?: number) =>
  typeof index === 'undefined' || !Array.isArray(context)
    ? context
    : context[index]

const getValueOrDefault = (state: State, runAlt: StateMapper) => (
  value: Data,
  index?: number
) =>
  typeof value === 'undefined'
    ? getStateValue(runAlt({ ...state, value: getOne(state.context, index) }))
    : value

export default function alt(fn: MapDefinition): Operation {
  return (options: Options) => {
    const runAlt = mapFunctionFromDef(fn, options)

    return (state: State) =>
      setStateValue(
        state,
        mapAny(getValueOrDefault(state, runAlt), state.value)
      )
  }
}
