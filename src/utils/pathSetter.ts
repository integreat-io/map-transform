import { mergeDeepWith, compose, identity, apply } from 'ramda'
import { Data, Path } from '../types'

const preparePathPart = (part: string, isAfterOpenArray: boolean) =>
  isAfterOpenArray ? `*${part}` : part

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
    case '*':
      return setOnSubArray(prop)
    default:
      return setOnObject(prop)
  }
}

export const mergeExisting = (left: any, right: any) => {
  if (Array.isArray(right)) {
    return right.reduce((arr, value, index) => {
      arr[index] = mergeDeepWith(mergeExisting, left[index], value)
      return arr
    }, left)
  }
  return right
}

export type SetFunction = (value: Data, object?: Data | null) => Data

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
  return (value, object = null) => {
    const data = setterFn(value)
    return object ? mergeDeepWith(mergeExisting, object, data) : data
  }
}
