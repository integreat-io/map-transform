import { pathGetter, pathSetter } from '../createPathMapper.js'
import {
  createDataMapper,
  createDataMapperAsync,
  DataMapper,
  DataMapperAsync,
} from '../createDataMapper.js'
import { revFromState } from '../utils/stateHelpers.js'
import { ensureArray } from '../utils/array.js'
import { isObject, isNonvalue } from '../utils/is.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import type State from '../state.js'
import type { TransformDefinition, Options } from '../prep/index.js'
import type {
  Transformer,
  AsyncTransformer,
  DataMapperWithState,
  AsyncDataMapperWithState,
  TransformerProps,
  Path,
} from '../types.js'

type BucketArgs = [
  string,
  number | undefined,
  DataMapper | DataMapperAsync | undefined,
]

export interface Bucket {
  key: string
  size?: number
  condition?: TransformDefinition
  pipeline?: TransformDefinition
}

export interface Props extends TransformerProps {
  path?: Path
  buckets?: Bucket[]
  groupByPath?: TransformDefinition
}

// Add `value` to the bucket array given by `key`.
export function addToBucket(
  value: unknown,
  buckets: Map<string, unknown[]>,
  key: string,
) {
  const bucket = buckets.get(key)
  if (bucket) {
    bucket.push(value)
  } else {
    buckets.set(key, [value])
  }
}

// Return the number of items in the bucket array given by `key`.
export function getBucketSize(buckets: Map<string, unknown[]>, key: string) {
  const bucket = buckets.get(key)
  return bucket ? bucket.length : 0
}

// Extract the values that will be needed when we consider the buckets with
// data. If we have a `condition` pipeline, we'll prepare a data mapper that
// will run it.
function prepareBuckets<T extends DataMapper | DataMapperAsync>(
  buckets: Bucket[],
  options: Options,
  createDataMapper: (def: TransformDefinition, options: Partial<Options>) => T,
): BucketArgs[] {
  return buckets
    .filter(({ key }) => typeof key === 'string')
    .map(function extract(bucket) {
      const condition = bucket.condition ?? bucket.pipeline
      return [
        bucket.key,
        bucket.size,
        condition ? createDataMapper(condition, options) : undefined,
      ]
    })
}

// Will go through each item in the data array and sort it into buckets based
// on either bucket conditions (a mapper, a max size, or both) or the return
// value from `getGroupFn`. This is a generator, and we yield values that may
// need to be awaited, to support both sync and async in the same function.
function* sortIntoBucketsGen(
  data: unknown,
  state: State,
  getFn: DataMapperWithState | AsyncDataMapperWithState,
  buckets: BucketArgs[],
  getGroupFn: DataMapperWithState | AsyncDataMapperWithState | undefined,
): Generator<unknown, unknown, unknown> {
  const arr = ensureArray(getFn(data, state))
  const retBucket = new Map<string, unknown[]>()

  if (buckets.length > 0) {
    for (const value of arr) {
      for (const [key, size, mapper] of buckets) {
        if (size === undefined || getBucketSize(retBucket, key) < size) {
          const isMatch = !mapper || !!(yield mapper(value, state))
          if (isMatch) {
            addToBucket(value, retBucket, key)
            break
          }
        }
      }
    }
  } else if (getGroupFn) {
    for (const value of arr) {
      const key = yield getGroupFn(value, state)
      if (!isNonvalue(key, state.nonvalues)) {
        addToBucket(value, retBucket, String(key))
      }
    }
  }

  return Object.fromEntries(retBucket.entries())
}

const extractArrayFromBuckets = (
  buckets: unknown,
  keys?: string[],
  nonvalues?: unknown[],
) =>
  isObject(buckets)
    ? (keys || Object.keys(buckets))
        // eslint-disable-next-line security/detect-object-injection
        .flatMap((key) => buckets[key])
        .filter((key) => !isNonvalue(key, nonvalues))
    : []

// Return keys from buckets. If there's no buckets and we have a group fn,
// return `undefined` to signal that we want whatever keys are in the data
const extractBucketKeys = (buckets: Bucket[], hasGroupFn: boolean) =>
  buckets.length === 0 && hasGroupFn ? undefined : buckets.map(({ key }) => key)

// Prepare the different getters and setters for the bucket functionality,
// the keys of all buckets, and args needed for each bucket.
export function prepare<T extends DataMapper | DataMapperAsync>(
  { path = '.', groupByPath, buckets = [] }: Props,
  options: Options,
  createDataMapper: (def: TransformDefinition, options: Partial<Options>) => T,
): [
  DataMapper,
  DataMapper,
  DataMapper | undefined,
  string[] | undefined,
  BucketArgs[],
] {
  const getFn = pathGetter(path)
  const setFn = pathSetter(path)
  const getGroupByPathFn = groupByPath
    ? createDataMapper(groupByPath, options)
    : undefined
  const keys = extractBucketKeys(buckets, !!getGroupByPathFn)
  const bucketArgs = prepareBuckets(
    buckets,
    options as Options,
    createDataMapper,
  )

  return [getFn, setFn, getGroupByPathFn, keys, bucketArgs]
}

/**
 * Will split an array out into buckets based on condition pipelines (pipelines
 * that will return truthy for the items that belong in a certain bucket) or by
 * size (how many items from the array to put in a bucket). Alternatively, you
 * may provide a `groupByPath`, and whatever that path returns, will be used as
 * bucket key.
 *
 * This version doesn't support async pipelines.
 */
export const bucket: Transformer<Props> = function bucket(props) {
  return (options) => {
    const [getFn, setFn, getGroupByPathFn, keys, bucketPipelines] = prepare(
      props,
      options as Options,
      createDataMapper,
    )

    return (data, state) => {
      if (revFromState(state)) {
        return setFn(
          extractArrayFromBuckets(data, keys, (state as State).nonvalues),
          state,
        )
      } else {
        const it = sortIntoBucketsGen(
          data,
          state as State,
          getFn,
          bucketPipelines,
          getGroupByPathFn,
        )
        return runIterator(it)
      }
    }
  }
}

/**
 * Will split an array out into buckets based on condition pipelines (pipelines
 * that will return truthy for the items that belong in a certain bucket) or by
 * size (how many items from the array to put in a bucket). Alternatively, you
 * may provide a `groupByPath`, and whatever that path returns, will be used as
 * bucket key.
 *
 * This version supports async pipelines.
 */
export const bucketAsync: AsyncTransformer<Props> = function bucket(props) {
  return (options) => {
    const [getFn, setFn, getGroupByPathFn, keys, bucketPipelines] = prepare(
      props,
      options as Options,
      createDataMapperAsync,
    )

    return async (data, state) => {
      if (revFromState(state)) {
        return setFn(
          extractArrayFromBuckets(data, keys, (state as State).nonvalues),
          state,
        )
      } else {
        const it = sortIntoBucketsGen(
          data,
          state as State,
          getFn,
          bucketPipelines,
          getGroupByPathFn,
        )
        return runIteratorAsync(it)
      }
    }
  }
}
