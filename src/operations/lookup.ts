import mapAny = require('map-any')
import pipe from './pipe.js'
import {
  Operation,
  State,
  Path,
  DataMapper,
  TransformerProps,
} from '../types.js'
import { get } from './getSet.js'
import { getStateValue, setStateValue } from '../utils/stateHelpers.js'
import { dataMapperFromOperation } from '../utils/definitionHelpers.js'
import { identity } from '../utils/functional.js'

export interface Props extends TransformerProps {
  arrayPath: Path
  propPath: Path
  matchSeveral?: boolean
}

const FLATTEN_DEPTH = 1

const flattenIfArray = (data: unknown) =>
  Array.isArray(data) ? data.flat(FLATTEN_DEPTH) : data

const matchPropInArray =
  (getProp: DataMapper, matchSeveral: boolean) =>
  (arr: unknown[], state: State) =>
  (value: string | number | boolean | null) =>
    matchSeveral
      ? arr.filter((obj) => getProp(obj, state) === value)
      : arr.find((obj) => getProp(obj, state) === value)

const mapValue = (
  getArray: Operation,
  getProp: DataMapper,
  matchSeveral: boolean
) => {
  const matchInArray = matchPropInArray(getProp, matchSeveral)
  return (state: State) => {
    if (state.rev) {
      return (value: unknown) => getProp(value, { ...state, rev: false }) // Do a regular get, even though we're in rev
    } else {
      const { value: arr } = getArray({})(identity)(state)
      return arr ? matchInArray(arr as unknown[], state) : () => undefined
    }
  }
}

export default function lookup({
  arrayPath,
  propPath,
  matchSeveral = false,
}: Props): Operation {
  return () => (next) => {
    const getter = dataMapperFromOperation(pipe(get(propPath)))
    const mapValueFn = mapValue(pipe([arrayPath]), getter, matchSeveral)

    return function doLookup(state) {
      const nextState = next(state)
      const matches = mapAny(mapValueFn(nextState), getStateValue(nextState))
      return setStateValue(nextState, flattenIfArray(matches))
    }
  }
}
