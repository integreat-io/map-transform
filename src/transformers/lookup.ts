import {
  createDataMapper,
  createDataMapperAsync,
  DataMapper,
  DataMapperAsync,
} from '../createDataMapper.js'
import { ensureArray } from '../utils/array.js'
import { flipState, revFromState } from '../utils/stateHelpers.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import type { Options, TransformDefinition } from '../prep/index.js'
import type {
  Transformer,
  AsyncTransformer,
  TransformerProps,
  State,
} from '../types.js'

export interface Props extends TransformerProps {
  arrayPath?: TransformDefinition
  propPath?: TransformDefinition
  matchSeveral?: boolean
}

// Do the actual lookup. The generator will yield values from pipelines to
// allow the caller to await it if necessary.
function* lookupGen(
  value: unknown,
  state: State,
  arrayGetter: DataMapper,
  propGetter: DataMapper,
  matchSeveral: boolean,
): Generator<unknown, unknown, unknown> {
  if (revFromState(state)) {
    // We're going in reverse -- just set the value on the `propPath`
    return propGetter(value, flipState(state))
  } else {
    // Make a Set with the values to keep track of what we have found
    const values = new Set(ensureArray(value))
    const matchOne = !Array.isArray(value)

    // Get the array
    const arr = ensureArray(yield arrayGetter(value, state))

    // Iterate over all values in the array, and look for matches
    const matches = new Map()
    for (const item of arr) {
      // Get the prop from the array
      const prop = yield propGetter(item, state)
      if (values.has(prop)) {
        // We have a match
        if (matchSeveral) {
          // We might have more matches per value, so add them to an array on
          // the `matches` Map with the prop as the key.
          const arr = matches.get(prop) ?? []
          matches.set(prop, [...arr, item])
        } else if (matchOne) {
          // We've got our only match, so just return it right away.
          return item
        } else {
          // We're expecting more matches, but only one for each value, so set
          // the match directly on the `matches` Map with the prop as key.
          matches.set(prop, item)
          // Remove the value, to not look for this value again.
          values.delete(prop)
        }
        if (values.size === 0) {
          // We have found all the matches we wanted, so stop looking.
          break
        }
      }
    }

    if (matchOne && !matchSeveral) {
      // We're matching only one, so when we get here we know there was no match.
      return undefined
    } else {
      // Pick out all matches from the `matches` Map in the order of the values
      // and return them as a flattened array.
      const result = ensureArray(value)
        .reduce<unknown[]>((arr, value) => [...arr, matches.get(value)], [])
        .flat()
      // Remove `undefined` when we're matching several. When we expect one
      // match for each value, we keep the `undefined`s to show that there was
      // no match.
      return matchSeveral ? result.filter(Boolean) : result
    }
  }
}

function prepare<T extends DataMapper | DataMapperAsync>(
  arrayPath: TransformDefinition,
  propPath: TransformDefinition,
  options: Options,
  createDataMapper: (def: TransformDefinition, options: Partial<Options>) => T,
): [DataMapper, DataMapper] {
  const arrayGetter = createDataMapper(arrayPath, options)
  const propGetter = createDataMapper(propPath, options)
  return [arrayGetter, propGetter]
}

/**
 * Get the array at the `arrayPath` pipeline, and find the first that has a
 * match to the pipeline value at the `propPath`. If the pipeline value is an
 * array, we'll find a match to each value if possible. If `matchSeveral` is
 * true, we'll return all matches.
 *
 * When we match with more values, or `matchSeveral` is true, the result is
 * returned as an array. The matches comes in the same order as the values they
 * match, and when `matchSeveral` is false, there will be `undefined` for all
 * values that did not match. When `matchSeveral` is true, we filter away
 * `undefined`, as the positions in the array cannot be mapped directly to the
 * values anyway.
 *
 * In reverse, we'll set the pipeline value with the `propPath`.
 *
 * This version does not support async pipelines.
 */
export const lookup: Transformer = function lookup({
  arrayPath = null,
  propPath = null,
  matchSeveral = false,
}: Props) {
  return (options) => {
    const [arrayGetter, propGetter] = prepare(
      arrayPath,
      propPath,
      options as Options,
      createDataMapper,
    )

    return function lookup(value, state) {
      const it = lookupGen(value, state, arrayGetter, propGetter, matchSeveral)
      return runIterator(it)
    }
  }
}

/**
 * Get the array at the `arrayPath` pipeline, and find the first that has a
 * match to the pipeline value at the `propPath`. If the pipeline value is an
 * array, we'll find a match to each value if possible. If `matchSeveral` is
 * true, we'll return all matches.
 *
 * When we match with more values, or `matchSeveral` is true, the result is
 * returned as an array. The matches comes in the same order as the values they
 * match, and when `matchSeveral` is false, there will be `undefined` for all
 * values that did not match. When `matchSeveral` is true, we filter away
 * `undefined`, as the positions in the array cannot be mapped directly to the
 * values anyway.
 *
 * In reverse, we'll set the pipeline value with the `propPath`.
 *
 * This version supports async pipelines.
 */
export const lookupAsync: AsyncTransformer = function lookup({
  arrayPath = null,
  propPath = null,
  matchSeveral = false,
}: Props) {
  return (options) => {
    const [arrayGetter, propGetter] = prepare(
      arrayPath,
      propPath,
      options as Options,
      createDataMapperAsync,
    )

    return async function lookup(value, state) {
      const it = lookupGen(value, state, arrayGetter, propGetter, matchSeveral)
      return runIteratorAsync(it)
    }
  }
}

/**
 * Behaves just like `lookup`, except the directions are flipped. Will lookup
 * in reverse and set the value on the prop path going forward.
 *
 * This version does not support async pipelines.
 */
export const lookdown: Transformer = function lookdown(props: Props) {
  return (options) => {
    const fn = lookup(props)(options)
    return (value, state) => fn(value, flipState(state))
  }
}

/**
 * Behaves just like `lookup`, except the directions are flipped. Will lookup
 * in reverse and set the value on the prop path going forward.
 *
 * This version supports async pipelines.
 */
export const lookdownAsync: AsyncTransformer = function lookdown(props: Props) {
  return (options) => {
    const fn = lookupAsync(props)(options)
    return async (value, state) => fn(value, flipState(state))
  }
}
