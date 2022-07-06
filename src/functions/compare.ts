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
  not?: boolean
}

const not = (comparer: Comparer) => (value: unknown, match: unknown) =>
  !comparer(value, match)

const compareArrayOrValue =
  (comparer: Comparer) => (value: unknown, match: unknown) =>
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

const compareIn = (value: unknown, match: unknown) =>
  Array.isArray(match)
    ? match.some((item) => compareEqual(value, item))
    : compareEqual(value, match)

const exists = (value: unknown) => value !== undefined

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
    case 'in':
      return compareIn
    case 'exists':
      return exists
    default:
      return (_value: unknown, _match: unknown) => false
  }
}

export default function compare({
  path = '.',
  operator = '=',
  match,
  matchPath,
  not = false,
}: CompareOperands): DataMapper {
  const getValue = getter(path)
  const useRoot = typeof matchPath === 'string' && matchPath[0] === '^'
  const realMatchPath = useRoot ? matchPath.slice(1) : matchPath
  const getMatch =
    typeof realMatchPath === 'string' ? getter(realMatchPath) : () => match
  const comparer = createComparer(operator)

  return (data, state) => {
    const value = getValue(data)
    const match = getMatch(useRoot ? state.root : data)
    const result = comparer(value, match)
    return not ? !result : result
  }
}
