import mapAny from 'map-any'
import {
  createDataMapper,
  createDataMapperAsync,
  DataMapper,
} from '../createDataMapper.js'
import { pathGetter } from '../createPathMapper.js'
import { goForward } from '../utils/stateHelpers.js'
import xor from '../utils/xor.js'
import { unescapeValue } from '../utils/escape.js'
import { isDate } from '../utils/is.js'
import type { TransformDefinition, Options } from '../prep/index.js'
import type {
  TransformerProps,
  Transformer,
  AsyncTransformer,
  DataMapperWithState,
  AsyncDataMapperWithState,
  Path,
  State,
} from '../types.js'

interface Comparer {
  (value: unknown, match: unknown): boolean
}

interface NumericComparer {
  (value: number, match: number): boolean
}

export interface Props extends TransformerProps {
  path?: TransformDefinition
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

const gtLtComparers = {
  '>': (value: number, match: number) => value > match,
  '>=': (value: number, match: number) => value >= match,
  '<': (value: number, match: number) => value < match,
  '<=': (value: number, match: number) => value <= match,
}

export function createComparer(operator: string) {
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
      // eslint-disable-next-line security/detect-object-injection
      return compareArrayOrValueNumeric(gtLtComparers[operator])
    default:
      // Any other operator will always return false
      return (_value: unknown, _match: unknown) => false
  }
}

function prepare({
  operator = '=',
  match,
  value,
  matchPath,
  valuePath,
}: Props): [(value: unknown, match: unknown) => boolean, DataMapper] {
  match = match === undefined ? value : match // Allow alias
  matchPath = matchPath ?? valuePath // Allow alias

  const realMatchValue = mapAny(unescapeValue, match)
  const comparer = createComparer(operator)
  const getMatch =
    typeof matchPath === 'string' ? pathGetter(matchPath) : () => realMatchValue
  return [comparer, getMatch]
}

function prepareValue(value: unknown) {
  if (isDate(value)) {
    return value.getTime()
  } else {
    return value
  }
}

export function doCompare(
  value: unknown,
  data: unknown,
  state: State,
  not: boolean,
  comparer: (value: unknown, match: unknown) => boolean,
  getMatch: DataMapper,
) {
  const match = getMatch(data, state)
  return xor(comparer(prepareValue(value), prepareValue(match)), not)
}

const createTransformer =
  (
    not: boolean,
    comparer: (value: unknown, match: unknown) => boolean,
    getValue: DataMapper,
    getMatch: DataMapper,
  ): DataMapperWithState =>
  (data, state) => {
    const value = getValue(data, goForward(state))
    return doCompare(value, data, state, not, comparer, getMatch)
  }

const createTransformerAsync =
  (
    not: boolean,
    comparer: (value: unknown, match: unknown) => boolean,
    getValue: DataMapper,
    getMatch: DataMapper,
  ): AsyncDataMapperWithState =>
  async (data, state) => {
    const value = await getValue(data, goForward(state))
    return doCompare(value, data, state, not, comparer, getMatch)
  }

export const compare: Transformer<Props> = function compare(props) {
  const { path = '.', not = false } = props
  return (options) => {
    const [comparer, getMatch] = prepare(props)
    const getValue = createDataMapper(path, options as Options)
    return createTransformer(not, comparer, getValue, getMatch)
  }
}

export const compareAsync: AsyncTransformer<Props> = function compare(props) {
  const { path = '.', not = false } = props
  return (options) => {
    const [comparer, getMatch] = prepare(props)
    const getValue = createDataMapperAsync(path, options as Options)
    return createTransformerAsync(not, comparer, getValue, getMatch)
  }
}
