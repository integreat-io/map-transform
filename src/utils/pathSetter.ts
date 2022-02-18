/* eslint-disable security/detect-object-injection */
import { identity } from './functional'
import { isObject } from './is'
import { ensureArray, cloneAsArray } from './array'
import { Path } from '../types'

export interface Setter {
  (value: unknown, target: unknown): unknown
}

const preparePathPart = (part: string, isAfterOpenArray: boolean) =>
  isAfterOpenArray ? `]${part}` : part

/**
 * Split a dot syntax path into its parts, including array brackets as a part
 * Note that any part after an open bracket `[]` will be prefixed by `]` to
 * signal that the setter should be applied to each item in the array.
 */
const pathSplitter = function* (path: Path) {
  const regEx = /([^[\].]+|\[\w*])/g
  let match
  let isAfterOpenArray = false
  do {
    match = regEx.exec(path)
    if (match) {
      yield preparePathPart(match[0], isAfterOpenArray)
      isAfterOpenArray = match[0] === '[]'
    }
  } while (match !== null)
}

/**
 * Sets the value returned by next on an object
 */
const createObjectSetter = (prop: string, next: Setter) =>
  function setOnObject(value: unknown, target: unknown): unknown {
    const obj = isObject(target) ? target : {}
    return {
      ...obj,
      [prop]: next(value, obj[prop]),
    }
  }

/**
 *  Sets the value returned by next in an array
 */
const createArraySetter = (prop: string, next: Setter) =>
  function setOnArray(value: unknown, target: unknown) {
    const index = Number.parseInt(prop.slice(1), 10)
    if (Number.isNaN(index)) {
      return ensureArray(next ? next(value, target) : value)
    } else {
      const arr = cloneAsArray(target)
      arr[index] = next(value, arr[index])
      return arr
    }
  }

/**
 *  Sets the value returned by next in an array from a parent array path
 */
function createSubArraySetter(prop: string, nextNext: Setter) {
  const next = createSetter(prop.slice(1), nextNext)

  return function setOnSubArray(value: unknown, target: unknown) {
    const arr = cloneAsArray(target)
    ensureArray(value).forEach((val, index) => {
      arr[index] = next(val, arr[index])
    })
    return arr
  }
}

/**
 * Create an appropriate setter for the give prop (path part)
 */
function createSetter(prop: string, next: Setter) {
  switch (prop[0]) {
    case '[':
      return createArraySetter(prop, next)
    case ']':
      return createSubArraySetter(prop, next)
    default:
      return createObjectSetter(prop, next)
  }
}

/**
 * Set `value` at `path` in `object`. Note that a new object is returned, and
 * the provided `object` is not mutated.
 *
 * Path may be a simple dot notation, and may include array brackets with or
 * without an index specified.
 */
export default function pathSetter(path: Path): Setter {
  return [...pathSplitter(path)].reduceRight(
    (next: Setter, part: string) => createSetter(part, next),
    identity
  )
}
