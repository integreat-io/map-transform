import { Operands, Path, DataMapper } from '../types'
import getter from '../utils/pathGetter'

interface Comparer {
  (value: unknown, match: unknown): boolean
}

interface NumericComparer {
  (value: number, match: number): boolean
}

interface CompareOperands extends Operands {
  path?: Path
  operator?: string
  match?: unknown
  matchPath?: Path
}

const not = (comparer: Comparer) => (value: unknown, match: unknown) =>
  !comparer(value, match)

const compareArrayOrValue = (comparer: Comparer) => (
  value: unknown,
  match: unknown
) =>
  Array.isArray(value)
    ? value.some((value: unknown) => comparer(value, match))
    : comparer(value, match)

const isNumeric = (value: unknown): value is number => typeof value === 'number'

const compareArrayOrValueNumeric = (comparer: NumericComparer) =>
  compareArrayOrValue(
    (value: unknown, match: unknown) =>
      isNumeric(value) && isNumeric(match) && comparer(value, match)
  )

const compareEqual = compareArrayOrValue(
  (value: unknown, match: unknown) => value === match
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
      return (_value: unknown, _match: unknown) => false
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
