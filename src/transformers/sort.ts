import type {
  Path,
  State,
  DataMapper,
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

const compare = (direction: number, getFn: DataMapper, state: State) =>
  function compare(valueA: unknown, valueB: unknown) {
    const a = getFn(valueA, state)
    const b = getFn(valueB, state)
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

const transformer: Transformer<Props> = function sort(props) {
  return (options) => {
    const direction = props?.asc === false ? -1 : 1
    const getFn = props?.path ? defToDataMapper(props.path, options) : identity

    return (data, state) => {
      return Array.isArray(data)
        ? data.slice().sort(compare(direction, getFn, goForward(state)))
        : data
    }
  }
}

export default transformer
