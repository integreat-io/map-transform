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
      // Find all matches in array. This has to support async, so we first map
      // over the array and get the value to compare against, then filter
      // against these values.
      const results = await Promise.all(
        arr.map(async (val) => await getProp(val, state))
      )
      return arr.filter((_v, index) => results[index] === value) // eslint-disable-line security/detect-object-injection
    } else {
      // Find first match in array. We use a for loop here, as we have to do it
      // asyncronously.
      for (const val of arr) {
        if ((await getProp(val, state)) === value) {
          return val
        }
      }
      return undefined
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
