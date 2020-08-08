import { Data, DataValue, Operands, Path, DataMapper } from '../types'
import getter from '../utils/pathGetter'

interface Comparer {
  (value: Data, match: Data): boolean
}

interface NumericComparer {
  (value: number, match: number): boolean
}

interface CompareOperands extends Operands {
  path?: Path
  operator?: string
  match?: DataValue
  matchPath?: Path
}

const not = (comparer: Comparer) => (value: Data, match: Data) =>
  !comparer(value, match)

const compareArrayOrValue = (comparer: Comparer) => (
  value: Data,
  match: Data
) =>
  Array.isArray(value)
    ? value.some((value: Data) => comparer(value, match))
    : comparer(value, match)

const isNumeric = (value: Data): value is number => typeof value === 'number'

const compareArrayOrValueNumeric = (comparer: NumericComparer) =>
  compareArrayOrValue(
    (value: Data, match: Data) =>
      isNumeric(value) && isNumeric(match) && comparer(value, match)
  )

const compareEqual = compareArrayOrValue(
  (value: Data, match: Data) => value === match
)

function createComparer(operator: string) {
  switch (operator) {
    case '=':
      return compareEqual
    case '!=':
      return not(compareEqual)
    case '>':
      return compareArrayOrValueNumeric(
        (value: number, match: number) => value > match
      )
    case '>=':
      return compareArrayOrValueNumeric(
        (value: number, match: number) => value >= match
      )
    case '<':
      return compareArrayOrValueNumeric(
        (value: number, match: number) => value < match
      )
    case '<=':
      return compareArrayOrValueNumeric(
        (value: number, match: number) => value <= match
      )
    default:
      return (_value: Data, _match: Data) => false
  }
}

export default function compare({
  path = '.',
  operator = '=',
  match,
  matchPath,
}: CompareOperands): DataMapper {
  const getValue = getter(path)
  const getMatch = matchPath ? getter(matchPath) : () => match

  const comparer = createComparer(operator)

  return (data) => {
    const value = getValue(data)
    const match = getMatch(data)
    return comparer(value, match)
  }
}
