import type {
  Operation,
  State,
  Path,
  DataMapperWithState,
  AsyncDataMapperWithState,
  TransformerProps,
} from '../types.js'
import { getStateValue, setStateValue } from '../utils/stateHelpers.js'
import { defToDataMapper, defToOperation } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'
import xor from '../utils/xor.js'
import {
  filterAsyncWithDataMapper,
  findAsyncWithDataMapper,
} from '../utils/array.js'

export interface Props extends TransformerProps {
  arrayPath: Path
  propPath: Path
  matchSeveral?: boolean
}

const FLATTEN_DEPTH = 1

const flattenIfArray = (data: unknown) =>
  Array.isArray(data) ? data.flat(FLATTEN_DEPTH) : data

const matchPropInArray =
  (
    getProp: DataMapperWithState | AsyncDataMapperWithState,
    matchSeveral: boolean
  ) =>
  (arr: unknown[], state: State) =>
  async (value: unknown) => {
    if (matchSeveral) {
      return filterAsyncWithDataMapper(arr, getProp, state, value)
    } else {
      return findAsyncWithDataMapper(arr, getProp, state, value)
    }
  }

const mapValue = (
  getArray: Operation,
  getProp: DataMapperWithState | AsyncDataMapperWithState,
  matchSeveral: boolean
) => {
  const matchInArray = matchPropInArray(getProp, matchSeveral)
  return async (state: State) => {
    if (xor(state.rev, state.flip)) {
      return async (value: unknown) =>
        await getProp(value, { ...state, rev: false }) // Do a regular get, even though we're in rev
    } else {
      const { value: arr } = await getArray({})(noopNext)(state)
      return arr ? matchInArray(arr as unknown[], state) : async () => undefined
    }
  }
}

export default function lookup({
  arrayPath,
  propPath,
  matchSeveral = false,
}: Props): Operation {
  return (options) => (next) => {
    const getter = defToDataMapper(propPath, options)
    const mapValueFn = mapValue(
      defToOperation(arrayPath, options),
      getter,
      matchSeveral
    )

    return async function doLookup(state) {
      const nextState = await next(state)
      const fn = await mapValueFn(nextState)
      const value = getStateValue(nextState)
      const matches = Array.isArray(value)
        ? await Promise.all(value.map(fn))
        : await fn(value)
      return setStateValue(nextState, flattenIfArray(matches))
    }
  }
}
