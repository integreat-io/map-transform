import {
  createDataMapper,
  createDataMapperAsync,
  DataMapper,
  DataMapperAsync,
} from '../createDataMapper.js'
import StateNext from '../state.js'
import { ensureArray } from '../utils/array.js'
import { isNotNullOrUndefined, isObject } from '../utils/is.js'
import type { TransformDefinition } from '../prep/index.js'
import type {
  Transformer,
  AsyncTransformer,
  TransformerProps,
  State,
} from '../types.js'
import type { Options } from '../prep/index.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'

export interface Props extends TransformerProps {
  path?: TransformDefinition | TransformDefinition[]
}

// Sort entries with value === undefined before other entries, to make sure that values are not overwritten by `undefined`
const undefinedFirst = (
  [_a, a]: [string, unknown],
  [_b, b]: [string, unknown],
) => (b === undefined && a !== undefined ? 1 : a === undefined ? -1 : 0)

const createGetFns = <T extends DataMapper | DataMapperAsync>(
  path: TransformDefinition | TransformDefinition[] | undefined,
  options: Options,
  createDataMapper: (def: TransformDefinition, options: Partial<Options>) => T,
): DataMapper[] =>
  ensureArray(path)
    .filter(isNotNullOrUndefined)
    .map((path) => createDataMapper(path, options))

export const mergeObjects = (values: unknown[]) =>
  Object.fromEntries(
    values.flat().filter(isObject).flatMap(Object.entries).sort(undefinedFirst),
  )

function setFlipOnState(state: State, flip: boolean) {
  return new StateNext({ ...state, flip })
}

// This is where the extraction of values and merging happens. We do it in a
// generator and yield the value from each pipeline, so that the caller may
// await the value and pass it back. We do this to support sync and async
// versions with as little duplicate code as possible.
function* mergePipelines(
  data: unknown,
  state: State,
  getFns: DataMapper[],
  flip: boolean,
): Generator<unknown, unknown, unknown> {
  const nextState = setFlipOnState(state, flip)
  const values: unknown[] = []
  for (const fn of getFns) {
    values.push(yield fn(data, nextState))
  }
  return mergeObjects(values)
}

const createTransformerSync = (
  getFns: DataMapper[],
  flip: boolean,
): DataMapper =>
  function merge(data, state) {
    const it = mergePipelines(data, state, getFns, flip)
    return runIterator(it)
  }

const createTransformerAsync = (
  getFns: DataMapper[],
  flip: boolean,
): DataMapperAsync =>
  async function merge(data, state) {
    const it = mergePipelines(data, state, getFns, flip)
    return runIteratorAsync(it)
  }

/**
 * When `path` is an array of paths or pipelines, we get all the objects
 * pointed to by the pipelines and merge them, with the last one overriding
 * props from the first one. If any of the paths points to an array, we merge
 * all items in that array with the other objects in the order they appear.
 *
 * When `path` is just a path, we retrieve the value it points to. If it's an
 * array, we merge all its items, if it's just an object, we return it.
 *
 * Any values that are not objects or arrays will be skipped.
 *
 * When going in reverse, we give the value to each pipeline. If all paths are
 * simple get paths, this will result in an object where the value is set on
 * all paths. This probably never be what we started with, if we first ran this
 * forward and then in reverse, but at least all paths will have some familiar
 * props.
 */
export const merge: Transformer<Props> =
  ({ path }: Props) =>
  (options) => {
    const getFns = createGetFns(path, options as Options, createDataMapper)
    return createTransformerSync(getFns, false)
  }

/**
 * This transformer will do exactly what `merge` does, but in reverse. When
 * we're going forward, it will behave as `merge` in reverse, and vica versa.
 */
export const mergeRev: Transformer<Props> =
  ({ path }: Props) =>
  (options) => {
    const getFns = createGetFns(path, options as Options, createDataMapper)
    return createTransformerSync(getFns, true)
  }

/**
 * The async version of the `merge` transformer.
 */
export const mergeAsync: AsyncTransformer<Props> =
  ({ path }: Props) =>
  (options) => {
    const getFns = createGetFns(
      path,
      options as Options,
      createDataMapperAsync,
    ) as DataMapperAsync[]
    return createTransformerAsync(getFns, false)
  }

/**
 * The async version of the `mergeRev` transformer.
 */
export const mergeRevAsync: AsyncTransformer<Props> =
  ({ path }: Props) =>
  (options) => {
    const getFns = createGetFns(
      path,
      options as Options,
      createDataMapperAsync,
    ) as DataMapperAsync[]
    return createTransformerAsync(getFns, true)
  }
