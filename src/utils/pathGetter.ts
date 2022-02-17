/* eslint-disable @typescript-eslint/no-explicit-any */
import { Path } from '../types'
import { isPath } from './definitionHelpers'
import { isObject } from '../utils/is'
import { identity, pipe } from '../utils/functional'

const numberOrString = (val: string): string | number => {
  const num = Number.parseInt(val, 10)
  return Number.isNaN(num) ? val : num
}

const split = (str: Path): string[] =>
  str.split(/\[|]?\.|]/).filter((str) => str !== '')

const getProp = (prop: string) => (object: unknown) =>
  isObject(object) ? object[prop] : undefined // eslint-disable-line security/detect-object-injection

const getArrayIndex = (index: number) => (arr: unknown) =>
  Array.isArray(arr) ? arr[index] : undefined // eslint-disable-line security/detect-object-injection

const getObjectOrArray = (fn: (object: unknown) => any) => (object: unknown) =>
  Array.isArray(object) ? object.flatMap(fn) : fn(object)

function createGetter(part: string) {
  const prop = numberOrString(part)
  return typeof prop === 'number'
    ? getArrayIndex(prop)
    : getObjectOrArray(getProp(prop))
}

const ensureArray = (value: unknown) =>
  Array.isArray(value)
    ? value
    : value === null || typeof value === 'undefined'
    ? []
    : [value]

export type GetFunction = (object?: unknown) => any

/**
 * Get the value at `path` in `object`.
 *
 * Path may be a simple dot notation, and may include array brackets with or
 * without an index specified.
 *
 * @param {string} path - The path to get
 * @returns {function} A function accepting an object to get the value from.
 */
export default function pathGetter(path: Path | null): GetFunction {
  if (isPath(path)) {
    const getters = split(path).map(createGetter)
    const fn = getters.length === 0 ? identity : pipe(...getters)

    return path.includes('[]') ? (value) => ensureArray(fn(value)) : fn
  }
  return identity
}
