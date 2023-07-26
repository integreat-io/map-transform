import { isNonvalue } from '../utils/stateHelpers.js'
import type {
  DataMapperWithState,
  AsyncDataMapperWithState,
  State,
} from '../types.js'

export const ensureArray = <T = unknown>(
  value: T | T[],
  nonvalues?: unknown[]
): T[] =>
  Array.isArray(value) ? value : isNonvalue(value, nonvalues) ? [] : [value]

export const cloneAsArray = (value: unknown) => ensureArray(value).slice()

export const indexOfIfArray = (arr: unknown, index?: number) =>
  Array.isArray(arr) && typeof index === 'number' ? arr[index] : arr // eslint-disable-line security/detect-object-injection

export async function filterAsyncWithDataMapper<T extends State = State>(
  arr: unknown[],
  getter: DataMapperWithState | AsyncDataMapperWithState,
  state: T,
  value: unknown
) {
  const results = await Promise.all(
    arr.map(async (val) => (await getter(val, state)) === value)
  )
  return arr.filter((_v, index) => results[index]) // eslint-disable-line security/detect-object-injection
}

export async function findAsyncWithDataMapper<T extends State = State>(
  arr: unknown[],
  getter: DataMapperWithState | AsyncDataMapperWithState,
  state: T,
  value: unknown
) {
  for (const val of arr) {
    if ((await getter(val, state)) === value) {
      return val
    }
  }
  return undefined
}
