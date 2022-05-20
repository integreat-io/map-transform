import { Path } from '../types'

export const isObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]'

export const isPath = (value: unknown): value is Path =>
  typeof value === 'string'

export const isArrayPath = (value: unknown): value is Path =>
  isPath(value) && value.endsWith('[]')
