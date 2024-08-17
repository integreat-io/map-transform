import {
  createDataMapper,
  DataMapper,
  DataMapperAsync,
} from '../createDataMapper.js'
import StateNext from '../state.js'
import { ensureArray } from '../utils/array.js'
import { isNotNullOrUndefined, isObject } from '../utils/is.js'
import type {
  TransformDefinition,
  TransformDefinitionAsync,
} from '../prep/index.js'
import type {
  Transformer,
  AsyncTransformer,
  TransformerProps,
  State,
} from '../types.js'
import type { Options } from '../prep/index.js'

export interface Props extends TransformerProps {
  path?: TransformDefinition | TransformDefinition[]
}

// Sort entries with value === undefined before other entries, to make sure that values are not overwritten by `undefined`
const undefinedFirst = (
  [_a, a]: [string, unknown],
  [_b, b]: [string, unknown],
) => (b === undefined && a !== undefined ? 1 : a === undefined ? -1 : 0)

const createGetFns = (
  path: TransformDefinition,
  options: Options,
): DataMapper[] =>
  ensureArray(path)
    .filter(isNotNullOrUndefined)
    .map((path) => createDataMapper(path, options))

const mergeObjects = (values: unknown[]) =>
  Object.fromEntries(
    values.flat().filter(isObject).flatMap(Object.entries).sort(undefinedFirst),
  )

function setFlipOnState(state: State, flip: boolean) {
  const nextState = new StateNext({ ...state, flip })
  nextState.replaceContext(state.context)
  return nextState
}

function createMergeTransformer(
  getFns: DataMapper[],
  flip: boolean,
): DataMapper {
  return function mergePipelines(data, state) {
    const nextState = setFlipOnState(state, flip)
    const values: unknown[] = []
    for (const fn of getFns) {
      values.push(fn(data, nextState))
    }
    return mergeObjects(values)
  }
}

function createMergeTransformerAync(
  getFns: DataMapperAsync[],
  flip: boolean,
): DataMapperAsync {
  return async function mergePipelines(data, state) {
    const nextState = setFlipOnState(state, flip)
    const values: unknown[] = []
    for (const fn of getFns) {
      values.push(await fn(data, nextState))
    }
    return mergeObjects(values)
  }
}

export const merge: Transformer<Props> =
  ({ path }: Props) =>
  (options) => {
    const getFns = createGetFns(path as TransformDefinition, options as Options)
    return createMergeTransformer(getFns, false)
  }

export const mergeRev: Transformer<Props> =
  ({ path }: Props) =>
  (options) => {
    const getFns = createGetFns(path as TransformDefinition, options as Options)
    return createMergeTransformer(getFns, true)
  }

// TODO: Replace with async mapTransform when it's ready
export const mergeAsync: AsyncTransformer<Props> =
  ({ path }: Props) =>
  (options) => {
    const getFns = createGetFns(
      path as TransformDefinitionAsync,
      options as Options,
    ) as DataMapperAsync[]
    return createMergeTransformerAync(getFns, false)
  }

// TODO: Replace with async mapTransform when it's ready
export const mergeRevAsync: AsyncTransformer<Props> =
  ({ path }: Props) =>
  (options) => {
    const getFns = createGetFns(
      path as TransformDefinitionAsync,
      options as Options,
    ) as DataMapperAsync[]
    return createMergeTransformerAync(getFns, true)
  }
