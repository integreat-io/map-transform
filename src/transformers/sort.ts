import type {
  Path,
  State,
  DataMapperWithState,
  TransformerProps,
  Transformer,
} from '../types.js'
import { identity } from '../utils/functional.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'
import { goForward } from '../utils/stateHelpers.js'

export interface Props extends TransformerProps {
  asc?: boolean
  path?: Path
}

type SortValue = [unknown, unknown]

const compare = (direction: number) =>
  function compare([a]: SortValue, [b]: SortValue) {
    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * direction
    } else if (a instanceof Date && b instanceof Date) {
      return (a.getTime() - b.getTime()) * direction
    } else if (a === undefined || a === null || b === undefined || b === null) {
      return a === undefined || a === null ? 1 : -1
    } else {
      const strA = String(a)
      const strB = String(b)
      return strA === strB ? 0 : strA > strB ? 1 * direction : -1 * direction
    }
  }

function fetchSortValue(getFn: DataMapperWithState, state: State) {
  return async function fetchSortValue(item: unknown): Promise<SortValue> {
    const sortBy = await getFn(item, state)
    return [sortBy, item]
  }
}

const transformer: Transformer<Props> = function sort(props) {
  return (options) => {
    const direction = props?.asc === false ? -1 : 1
    const getFn = props?.path ? defToDataMapper(props.path, options) : identity

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
