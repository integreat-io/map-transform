import { DataObject } from '../types'

export const isObject = (obj: unknown): obj is DataObject =>
  typeof obj === 'object' &&
  obj !== null &&
  !Array.isArray(obj) &&
  !(obj instanceof Date)
