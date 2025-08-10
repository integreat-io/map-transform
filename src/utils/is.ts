import type { Path } from '../types.js'

export const isObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]'

export const isDate = (value: unknown): value is Date =>
  Object.prototype.toString.call(value) === '[object Date]'

export const isString = (value: unknown): value is string =>
  typeof value === 'string'

export const isPath = (value: unknown): value is Path =>
  typeof value === 'string'

export const isArrayPath = (value: unknown): value is Path =>
  isPath(value) && value.endsWith('[]')

export const isNullOrUndefined = (value: unknown): value is null | undefined =>
  value === null || value === undefined

export const isNotNullOrUndefined = <T>(value: T): value is NonNullable<T> =>
  !isNullOrUndefined(value)

export const isNonEmptyArray = <T>(value: unknown): value is T[] =>
  Array.isArray(value) && value.length > 0
