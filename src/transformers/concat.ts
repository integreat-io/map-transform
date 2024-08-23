import {
  createDataMapper,
  createDataMapperAsync,
  DataMapper,
  DataMapperAsync,
} from '../createDataMapper.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import { ensureArray } from '../utils/array.js'
import { isNonvalue } from '../utils/is.js'
import { flipState, revFromState } from '../utils/stateHelpers.js'
import type StateNext from '../state.js'
import type {
  Transformer,
  AsyncTransformer,
  TransformerProps,
  State,
} from '../types.js'
import type {
  Options as OptionsNext,
  TransformDefinition,
} from '../prep/index.js'

export interface Props extends TransformerProps {
  path?: TransformDefinition | TransformDefinition[]
}

const mergeValues = <T, U>(left: T[], right: U | U[]) =>
  Array.isArray(right) ? [...left, ...right] : [...left, right]

function* concatGen(
  value: unknown,
  state: State,
  getFns: DataMapper[] | DataMapperAsync[],
): Generator<unknown, unknown, unknown> {
  if (revFromState(state)) {
    // We're in reverse -- set the value on the first pipeline and pass an
    // empty array to the rest.
    let merged = yield getFns[0](value, state)
    for (const getFn of getFns.slice(1)) {
      merged = yield getFn([], { ...state, target: merged })
    }
    return merged
  } else {
    // We're going forward -- get the value from each pipeline and merge into
    // one array.
    let merged: unknown[] = []
    for (const getFn of getFns) {
      const arr = yield getFn(value, state)
      merged = mergeValues(merged, arr)
    }
    // Filter away non-values
    return merged.filter(
      (val) => !isNonvalue(val, (state as StateNext).nonvalues),
    )
  }
}

function mergeWithNoPipelines(state: State) {
  return revFromState(state) ? {} : []
}

/**
 * Get the value from all pipelines given in `path` and merge them all into one
 * array. In reverse, the pipeline value will be set on the first pipeline, and
 * an empty array will be set on the rest.
 *
 * This version does not support async pipelines.
 */
export const concat: Transformer = function concat({ path = [] }: Props) {
  return (options) => {
    const getFns = ensureArray(path).map((pipeline) =>
      createDataMapper(pipeline, options as OptionsNext),
    )
    if (getFns.length === 0) {
      return (_value, state) => mergeWithNoPipelines(state)
    }

    return function concat(value, state) {
      const it = concatGen(value, state, getFns)
      return runIterator(it)
    }
  }
}

/**
 * Get the value from all pipelines given in `path` and merge them all into one
 * array. In reverse, the pipeline value will be set on the first pipeline, and
 * an empty array will be set on the rest.
 *
 * This version supports async pipelines.
 */
export const concatAsync: AsyncTransformer = function concat({
  path = [],
}: Props) {
  return (options) => {
    const getFns = ensureArray(path).map((pipeline) =>
      createDataMapperAsync(pipeline, options as OptionsNext),
    )
    if (getFns.length === 0) {
      return async (_value, state) => mergeWithNoPipelines(state)
    }

    return async function concat(value, state) {
      const it = concatGen(value, state, getFns)
      return runIteratorAsync(it)
    }
  }
}

/**
 * Behaves like `concat`, but with the directions flipped, so it will get and
 * merge to an error in reverse, and set the value on the first pipeline going
 * forward.
 *
 * This version does not support async pipelines.
 */
export const concatRev: Transformer = function concatRev(props: Props) {
  return (options) => {
    const fn = concat(props)(options)
    return (value, state) => fn(value, flipState(state))
  }
}

/**
 * Behaves like `concat`, but with the directions flipped, so it will get and
 * merge to an error in reverse, and set the value on the first pipeline going
 * forward.
 *
 * This version supports async pipelines.
 */
export const concatRevAsync: AsyncTransformer = function concatRev(
  props: Props,
) {
  return (options) => {
    const fn = concatAsync(props)(options)
    return async (value, state) => fn(value, flipState(state))
  }
}
