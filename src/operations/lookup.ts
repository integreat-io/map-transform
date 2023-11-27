import mapAny from 'map-any/async.js'
import { pathGetter } from '../operations/getSet.js'
import type { Operation, State, Path, TransformerProps } from '../types.js'
import {
  getStateValue,
  setStateValue,
  goForward,
  revFromState,
} from '../utils/stateHelpers.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'

export interface Props extends TransformerProps {
  arrayPath: Path
  propPath: Path
  matchSeveral?: boolean
  flip?: boolean
}

interface GetPropFn {
  (val: unknown, state: State): unknown
}

interface MatchFn {
  (value: unknown, state: State, arr: unknown[], getProp: GetPropFn): unknown
}

const FLATTEN_DEPTH = 1

const flattenIfArray = (data: unknown) =>
  Array.isArray(data) ? data.flat(FLATTEN_DEPTH) : data

// Find all matches in array. To support async, we first map over the
// array and get the value to compare against, then filter against these
// values.
const findAllMatches: MatchFn = (value, state, arr, getProp) =>
  arr.filter((val) => getProp(val, state) === value)

// Find first match in array. We use a for loop here, as we have to do it
// asyncronously.
const findOneMatch: MatchFn = (value, state, arr, getProp) =>
  arr.find((val) => getProp(val, state) === value)

// Do the actual lookup. Will retrieve the array from the given state, and then
// compare to the state value.
const matchInArray =
  (getArray: Operation, match: MatchFn, getProp: GetPropFn) =>
  (state: State) => {
    const getFn = getArray({})(noopNext)
    return async (value: unknown) => {
      const { value: arr } = await getFn(goForward(state))
      return Array.isArray(arr) ? match(value, state, arr, getProp) : undefined
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
    if (typeof propPath !== 'string' && propPath !== undefined) {
      throw new TypeError(
        "The 'lookup' operation does not allow `path` (the prop path) to be a pipeline",
      )
    }

    const getter = pathGetter(propPath)
    const matchFn = matchInArray(
      defToOperation(arrayPath, options),
      matchSeveral ? findAllMatches : findOneMatch,
      getter,
    )
    const extractProp = (state: State) => async (value: unknown) =>
      getter(value, state)

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
