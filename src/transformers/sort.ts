import { pathGetter } from '../createPathMapper.js'
import type {
  Path,
  State,
  DataMapperWithState,
  TransformerProps,
  Transformer,
} from '../types.js'

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

function fetchSortValue(getFn: DataMapperWithState, state: State) {
  return function fetchSortValue(item: unknown): SortValue {
    const sortBy = getFn(item, state)
    return [sortBy, item]
  }
}

const transformer: Transformer<Props> = function sort(props) {
  return () => {
    const { path, asc } = props || {}
    if (typeof path !== 'string' && path !== undefined) {
      throw new TypeError(
        "The 'sort' transformer does not allow `path` to be a pipeline",
      )
    }

    const direction = asc === false ? -1 : 1
    const getFn = path ? pathGetter(path) : (value: unknown) => value

    return (data, state) => {
      if (!Array.isArray(data) || data.length < 2) {
        // We don't need to sort one or no item
        return data
      }

      // We first fetch value to sort by for each item ...
      const sortArray = data.map(fetchSortValue(getFn, state))
      /// ... and then sort the array and returns the original items
      return sortArray.sort(compare(direction)).map(([_, item]) => item)
    }
  }
}

export default transformer
