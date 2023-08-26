import mapAny from 'map-any/async.js'
import type {
  Operation,
  State,
  Path,
  DataMapperWithState,
  AsyncDataMapperWithState,
  TransformerProps,
} from '../types.js'
import {
  getStateValue,
  setStateValue,
  goForward,
  revFromState,
} from '../utils/stateHelpers.js'
import { defToDataMapper, defToOperation } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'

export interface Props extends TransformerProps {
  arrayPath: Path
  propPath: Path
  matchSeveral?: boolean
  flip?: boolean
}

const FLATTEN_DEPTH = 1

const flattenIfArray = (data: unknown) =>
  Array.isArray(data) ? data.flat(FLATTEN_DEPTH) : data

// Find all matches in array. To support async, we first map over the
// array and get the value to compare against, then filter against these
// values.
async function findAllMatches(
  value: unknown,
  arr: unknown[],
  state: State,
  getProp: DataMapperWithState | AsyncDataMapperWithState
) {
  const results = await Promise.all(
    arr.map(async (val) => await getProp(val, state))
  )
  return arr.filter((_v, index) => results[index] === value) // eslint-disable-line security/detect-object-injection
}

// Find first match in array. We use a for loop here, as we have to do it
// asyncronously.
async function findOneMatch(
  value: unknown,
  arr: unknown[],
  state: State,
  getProp: DataMapperWithState | AsyncDataMapperWithState
) {
  for (const val of arr) {
    if ((await getProp(val, state)) === value) {
      return val
    }
  }
  return undefined
}

// Do the actual lookup. Will retrieve the array from the given state, and then
// compare to the state value.
const matchInArray =
  (
    getArray: Operation,
    getProp: DataMapperWithState | AsyncDataMapperWithState,
    matchSeveral: boolean
  ) =>
  (state: State) => {
    return async (value: unknown) => {
      const fwdState = goForward(state)
      const { value: arr } = await getArray({})(noopNext)(goForward(fwdState))
      if (!Array.isArray(arr)) {
        return undefined
      }
      return matchSeveral
        ? findAllMatches(value, arr, fwdState, getProp)
        : findOneMatch(value, arr, fwdState, getProp)
    }
  }

/**
 * Will use the value in the pipeline to lookup objects found in the `arrayPath`
 * array. Matching is done by comparing the the pipeline value to the value at
 * `propPath` in each object in the array. If `matchSeveral` is `true`, all
 * matches will be returned, otherwise only the first match will be returned.
 * The pipeline value will be replaced by the result of the lookup, or
 * `undefined`.
 *
 * In reverse, `propPath` will be used to extract a value from the object(s) on
 * the pipeline. This is considered to be the oposite behavior of the lookup,
 * leading to the match value from the lookup being put back in the pipeline.
 *
 * Note that `flip` will reverse this behavior, and the `flip` property and the
 * state `flip` will "flip each others".
 */
export function lookup({
  arrayPath,
  propPath,
  matchSeveral = false,
  flip = false,
}: Props): Operation {
  return (options) => {
    const getter = defToDataMapper(propPath, options)
    const matchFn = matchInArray(
      defToOperation(arrayPath, options),
      getter,
      matchSeveral
    )
    const extractProp = (state: State) => async (value: unknown) =>
      await getter(value, goForward(state))

    return (next) =>
      async function doLookup(state) {
        const nextState = await next(state)
        const value = getStateValue(nextState)
        const rev = revFromState(state, flip)
        const matcher = rev ? extractProp : matchFn
        const matches = await mapAny(matcher(nextState), value)
        return setStateValue(nextState, flattenIfArray(matches))
      }
  }
}

// `lookdown` is the exact oposite of `lookup`, and will lookup in reverse
// and extract prop going forward. State `flip` will be flipped too.
export function lookdown(props: Props): Operation {
  return lookup({ ...props, flip: !props.flip })
}
