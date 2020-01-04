import { ObjectWithProps } from '../types'

export const isObject = (obj: unknown): obj is ObjectWithProps =>
  typeof obj === 'object' &&
  obj !== null &&
  !Array.isArray(obj) &&
  !(obj instanceof Date)
