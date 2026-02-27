import mapAny from 'map-any'
import { pathGetter } from '../../createPathMapper.js'
import { doCompare, createComparer } from '../../transformers/compare.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'
import type {
  TransformerProps,
  Transformer,
  AsyncTransformer,
  Path,
  TransformDefinition,
} from '../types.js'
import { unescapeValue } from '../../utils/escape.js'
import StateClass from '../../state.js'

export interface Props extends TransformerProps {
  path?: Path | TransformDefinition
  operator?: string
  match?: unknown
  matchPath?: Path
  value?: unknown // Alias of `match`
  valuePath?: Path // Alias of `matchPath`
  not?: boolean
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
          const stateNext = new StateClass(state)
          const value = getValue(data, stateNext)
          return doCompare(value, data, stateNext, not, comparer, getMatch)
        }
      } else {
        const getValue = defToDataMapper(path, options)
        return async (data, state) => {
          const stateNext = new StateClass(state)
          const value = await getValue(data, stateNext.forwardState())
          return doCompare(value, data, stateNext, not, comparer, getMatch)
        }
      }
    }
  }

export default transformer
