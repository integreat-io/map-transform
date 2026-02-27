import {
  prepare,
  addToBucket,
  getBucketSize,
  type Props as PropsNext,
  type CreateDataMapper,
} from '../../transformers/bucket.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'
import { ensureArray } from '../../utils/array.js'
import { isObject, isNonvalue } from '../../utils/is.js'
import StateClass from '../../state.js'
import type {
  AsyncTransformer,
  TransformerProps,
  TransformDefinition,
  Path,
} from '../types.js'
import type { Options as OptionsNext } from '../../prep/index.js'
import type { DataMapper, DataMapperAsync } from '../../createDataMapper.js'

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

async function sortIntoBuckets(
  getFn: DataMapper,
  buckets: BucketArgs[],
  getGroupFn: DataMapper | undefined,
  data: unknown,
  state: StateClass,
  nonvalues?: unknown[],
) {
  const arr = ensureArray(getFn(data, state))
  const retBucket = new Map<string, unknown[]>()

  if (buckets.length > 0) {
    for (const value of arr) {
      for (const [key, size, mapper] of buckets) {
        if (size === undefined || getBucketSize(retBucket, key) < size) {
          const isMatch = !mapper || !!(await mapper(value, state))
          if (isMatch) {
            addToBucket(value, retBucket, key)
            break
          }
        }
      }
    }
  } else if (getGroupFn) {
    for (const value of arr) {
      const key = await getGroupFn(value, state)
      if (!isNonvalue(key, nonvalues)) {
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

const transformer: AsyncTransformer<Props> = function bucket(props) {
  return (options) => {
    const [getFn, setFn, getGroupByPathFn, keys, bucketPipelines] = prepare(
      props as PropsNext, // These type overrides are not strictly correct, but ...
      options as OptionsNext, // ... will do for now, as this is a temporary solution
      defToDataMapper as CreateDataMapper<DataMapper>,
    )

    return async (data, state) => {
      const stateNext = new StateClass(state)
      if (stateNext.isRev) {
        return setFn(
          extractArrayFromBuckets(data, keys, options.nonvalues),
          stateNext,
        )
      } else {
        return sortIntoBuckets(
          getFn,
          bucketPipelines,
          getGroupByPathFn,
          data,
          stateNext,
          options.nonvalues,
        )
      }
    }
  }
}

export default transformer
