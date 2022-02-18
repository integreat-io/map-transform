/* eslint-disable security/detect-object-injection */
import { Path } from '../types'
import { isPath } from './definitionHelpers'
import { isObject } from './is'
import { ensureArray } from './array'
import { identity, pipe } from './functional'

export interface Getter {
  (object?: unknown): unknown
}

const numberOrString = (val: string): string | number => {
  const num = Number.parseInt(val, 10)
  return Number.isNaN(num) ? val : num
}

const split = (str: Path): string[] =>
  str.split(/\[|]?\.|]/).filter((str) => str !== '')

const getProp = (prop: string) => (object: unknown) =>
  isObject(object) ? object[prop] : undefined

const getArrayIndex = (index: number) => (arr: unknown) =>
  Array.isArray(arr) ? arr[index] : undefined

const getObjectOrArray =
  (fn: (object: unknown) => unknown) => (object: unknown) =>
    Array.isArray(object) ? object.flatMap(fn) : fn(object)

function createGetter(part: string) {
  const prop = numberOrString(part)
  return typeof prop === 'number'
    ? getArrayIndex(prop)
    : getObjectOrArray(getProp(prop))
}

/**
 * Get the value at `path` in `value`.
 *
 * Path may be a simple dot notation, and may include array brackets with or
 * without an index specified.
 */
export default function pathGetter(path: Path | null): Getter {
  if (isPath(path)) {
    const getters = split(path).map(createGetter)
    const fn = getters.length === 0 ? identity : pipe(...getters)

    return path.includes('[]') ? (value) => ensureArray(fn(value)) : fn
  }
  return identity
}
