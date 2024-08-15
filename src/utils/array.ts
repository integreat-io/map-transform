import { isNonvalue } from '../utils/is.js'

export const ensureArray = <T = unknown>(
  value: T | T[],
  nonvalues?: unknown[],
): T[] =>
  Array.isArray(value) ? value : isNonvalue(value, nonvalues) ? [] : [value]

export const cloneAsArray = (value: unknown) => ensureArray(value).slice()

export const indexOfIfArray = (arr: unknown, index?: number) =>
  Array.isArray(arr) && typeof index === 'number' ? arr[index] : arr // eslint-disable-line security/detect-object-injection
