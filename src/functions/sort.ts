import {
  Path,
  DataMapper,
  Options,
  Operands as BaseOperands,
} from '../types.js'
import { identity } from '../utils/functional.js'
import { defsToDataMapper } from '../utils/definitionHelpers.js'

interface Operands extends BaseOperands {
  asc?: boolean
  path?: Path
}

const compare = (direction: number, getFn: (data: unknown) => unknown) =>
  function compare(valueA: unknown, valueB: unknown) {
    const a = getFn(valueA)
    const b = getFn(valueB)
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

export default function template(
  operands: Operands,
  _options: Options = {}
): DataMapper {
  const direction = operands?.asc === false ? -1 : 1
  const getFn = operands?.path ? defsToDataMapper(operands.path) : identity

  return (data) => {
    return Array.isArray(data)
      ? data.slice().sort(compare(direction, getFn))
      : data
  }
}
