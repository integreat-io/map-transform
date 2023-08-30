import type {
  Path,
  State,
  DataMapperWithState,
  AsyncDataMapperWithState,
  TransformerProps,
  AsyncTransformer,
} from '../types.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'
import { goForward } from '../utils/stateHelpers.js'

export interface Props extends TransformerProps {
  asc?: boolean
  path?: Path
}

type SortValue = [unknown, unknown]

const compareNumbers = (a: number, b: number, direction: number) =>
  (a - b) * direction

const compareStrings = (a: string, b: string, direction: number) =>
  a === b ? 0 : a > b ? direction : -1 * direction

const compare = (direction: number) =>
  function compare([a]: SortValue, [b]: SortValue) {
    if (typeof a === 'number' && typeof b === 'number') {
      return compareNumbers(a, b, direction)
    } else if (a instanceof Date && b instanceof Date) {
      return compareNumbers(a.getTime(), b.getTime(), direction)
    } else if (a === undefined || a === null || b === undefined || b === null) {
      return a === undefined || a === null ? 1 : -1
    } else {
      return compareStrings(String(a), String(b), direction)
    }
  }

function fetchSortValue(
  getFn: DataMapperWithState | AsyncDataMapperWithState,
  state: State
) {
  return async function fetchSortValue(item: unknown): Promise<SortValue> {
    const sortBy = await getFn(item, state)
    return [sortBy, item]
  }
}

const transformer: AsyncTransformer<Props> = function sort(props) {
  return (options) => {
    const direction = props?.asc === false ? -1 : 1
    const getFn = props?.path
      ? defToDataMapper(props.path, options)
      : async (value: unknown) => value

    return async (data, state) => {
      if (!Array.isArray(data) || data.length < 2) {
        // We don't need to sort one or no item
        return data
      }

      const fwdState = goForward(state)

      // We first fetch value to sort by for each item ...
      const sortArray: SortValue[] = await Promise.all(
        data.map<Promise<SortValue>>(fetchSortValue(getFn, fwdState))
      )
      /// ... and then sort the array and returns the original items
      return sortArray.sort(compare(direction)).map(([_, item]) => item)
    }
  }
}

export default transformer
