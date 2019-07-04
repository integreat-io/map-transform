import mapAny = require('map-any')
import {
  State,
  Data,
  Operation,
  StateMapper,
  DataMapper,
  MapPipe,
  Options
} from '../types'
import { setStateValue, getStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'
import transform from './transform'
import { get } from './getSet'

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

export default function alt(fn: DataMapper | MapPipe | string): Operation {
  const runAlt =
    typeof fn === 'string'
      ? get(fn)
      : Array.isArray(fn)
      ? (options: Options) => mapFunctionFromDef(fn, options)
      : transform(fn)

  return (options: Options) => {
    return (state: State) =>
      setStateValue(
        state,
        mapAny(getValueOrDefault(state, runAlt(options)), state.value)
      )
  }
}
