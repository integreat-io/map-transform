import { mergeDeepWith, compose, identity, apply } from 'ramda'
import { Data, Path } from '../types'

const preparePathPart = (part: string, isAfterOpenArray: boolean) =>
  isAfterOpenArray ? `]${part}` : part

const pathSplitter = function*(path: Path) {
  const regEx = /([^[\].]+|\[\w*])/g
  let match
  let isAfterOpenArray = false
  do {
    match = regEx.exec(path)
    if (match) {
      yield preparePathPart(match[0], isAfterOpenArray)
      isAfterOpenArray = isAfterOpenArray || match[0] === '[]'
    }
  } while (match !== null)
}

const split = (path: Path): string[] => [...pathSplitter(path)]

const setOnObject = (prop: string) => (value: Data): Data => ({ [prop]: value })

const setOnOpenArray = (value: Data) => (Array.isArray(value) ? value : [value])

const setOnArrayIndex = (index: number, value: Data) => {
  const arr = []
  arr[index] = value
  return arr
}

const setOnArray = (prop: string) => (value: Data): Data => {
  const index = parseInt(prop.substr(1), 10)
  return isNaN(index) ? setOnOpenArray(value) : setOnArrayIndex(index, value)
}

const setOnSubArray = (prop: string) => (value: Data): Data =>
  ([] as Data[]).concat(value).map(setOnObject(prop.substr(1)))

const setter = (prop: string) => {
  switch (prop[0]) {
    case '[':
      return setOnArray(prop)
    case ']': // `]` signals we are after an open array
      return setOnSubArray(prop)
    default:
      return setOnObject(prop)
  }
}

const ensureArray = (value: unknown) => (Array.isArray(value) ? value : [value])

const isObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null

const mergeArrays = (left: unknown[], right: unknown[]) =>
  right.reduce((arr: unknown[], value, index) => {
    arr[index] = merge(left[index], value)
    return arr
  }, left)

const mergeExisting = (left: unknown, right: unknown) =>
  Array.isArray(right) ? mergeArrays(ensureArray(left), right) : right

export const merge = (left: unknown, right: unknown) =>
  left === undefined || right === undefined
    ? right === undefined
      ? left
      : right
    : Array.isArray(right)
    ? mergeArrays(ensureArray(left), right)
    : isObject(right)
    ? mergeDeepWith(mergeExisting, left, right)
    : right

export type SetFunction = (value: Data, object?: Data) => Data

/**
 * Set `value` at `path` in `object`. Note that a new object is returned, and
 * the provided `object` is not mutated.
 *
 * Path may be a simple dot notation, and may include array brackets with or
 * without an index specified.
 *
 * @param {string} path - The path to set the value at
 * @returns {function} A setter function accepting a value and a target object
 */
export default function pathSetter(path: Path): SetFunction {
  const setters = split(path).map(setter)

  if (setters.length === 0) {
    return identity
  }

  const setterFn: SetFunction = apply(compose, setters) as any // Using apply() to avoid complaints from typescript
  return (value, object) => {
    const data = setterFn(value)
    return merge(object, data)
  }
}
