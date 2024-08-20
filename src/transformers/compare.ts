import mapAny from 'map-any'
import { pathGetter } from '../createPathMapper.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'
import { goForward } from '../utils/stateHelpers.js'
import xor from '../utils/xor.js'
import type {
  TransformerProps,
  Transformer,
  AsyncTransformer,
  Path,
  TransformDefinition,
} from '../types.js'
import { unescapeValue } from '../utils/escape.js'
import { isDate } from '../utils/is.js'

interface Comparer {
  (value: unknown, match: unknown): boolean
}

interface NumericComparer {
  (value: number, match: number): boolean
}

export interface Props extends TransformerProps {
  path?: Path | TransformDefinition
  operator?: string
  match?: unknown
  matchPath?: Path
  value?: unknown // Alias of `match`
  valuePath?: Path // Alias of `matchPath`
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

function prepareValue(value: unknown) {
  if (isDate(value)) {
    return value.getTime()
  } else {
    return value
  }
}

const compareArrayOrValueNumeric = (comparer: NumericComparer) =>
  compareArrayOrValue(
    (value: unknown, match: unknown) =>
      isNumeric(value) && isNumeric(match) && comparer(value, match),
  )

const compareEqual = compareArrayOrValue(
  (value: unknown, match: unknown) => value === match,
)

const compareIn = (value: unknown, match: unknown) =>
  Array.isArray(match)
    ? match.some((item) => compareEqual(value, item))
    : compareEqual(value, match)

const exists = (value: unknown) => value !== undefined

function getGtLtComparer(operator: '>' | '>=' | '<' | '<=') {
  switch (operator) {
    case '>':
      return (value: number, match: number) => value > match
    case '>=':
      return (value: number, match: number) => value >= match
    case '<':
      return (value: number, match: number) => value < match
    case '<=':
      return (value: number, match: number) => value <= match
  }
}

function createComparer(operator: string) {
  switch (operator) {
    case '=':
      return compareEqual
    case '!=':
      return not(compareEqual)
    case 'in':
      return compareIn
    case 'exists':
      return exists
    case '>':
    case '>=':
    case '<':
    case '<=':
      return compareArrayOrValueNumeric(getGtLtComparer(operator))
    default:
      // Any other operator will always return false
      return (_value: unknown, _match: unknown) => false
  }
}

const transformer: Transformer<Props> | AsyncTransformer<Props> =
  function compare({
    path = '.',
    operator = '=',
    match,
    value,
    matchPath,
    valuePath,
    not = false,
  }) {
    match = match === undefined ? value : match // Allow alias
    matchPath = matchPath ?? valuePath // Allow alias

    return (options) => {
      const realMatchValue = mapAny(unescapeValue, match)
      const comparer = createComparer(operator)
      const getMatch =
        typeof matchPath === 'string'
          ? pathGetter(matchPath)
          : () => realMatchValue

      if (typeof path === 'string' || !path) {
        const getValue = pathGetter(path)
        return (data, state) => {
          const value = prepareValue(getValue(data, state))
          const match = prepareValue(getMatch(data, state))
          return xor(comparer(value, match), not)
        }
      } else {
        const getValue = defToDataMapper(path, options)
        return async (data, state) => {
          const value = prepareValue(await getValue(data, goForward(state)))
          const match = prepareValue(getMatch(data, state))
          return xor(comparer(value, match), not)
        }
      }
    }
  }

export default transformer
