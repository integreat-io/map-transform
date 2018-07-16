import * as R from 'ramda'
import { Data } from '..'
import { PathString } from './lensPath'

const preparePathPart = (part: string, isAfterOpenArray: boolean) =>
  (isAfterOpenArray) ? `*${part}` : part

const pathSplitter = function* (path: PathString) {
  const regEx = /([^[\].]+|\[\w*])/g
  let match
  let isAfterOpenArray = false
  do {
    match = regEx.exec(path)
    if (match) {
      yield preparePathPart(match[0], isAfterOpenArray)
      isAfterOpenArray = isAfterOpenArray || (match[0] === '[]')
    }
  } while (match !== null)
}

const split = (path: PathString): string[] => [...pathSplitter(path)]

const setOnObject = (prop: string) => (value: Data): Data =>
  ({ [prop]: value })

const setOnOpenArray = (value: Data) =>
  (Array.isArray(value)) ? value : [value]

const setOnArrayIndex = (index: number, value: Data) => {
  const arr = []
  arr[index] = value
  return arr
}

const setOnArray = (prop: string) => (value: Data): Data => {
  const index = parseInt(prop.substr(1), 10)
  return (isNaN(index))
    ? setOnOpenArray(value)
    : setOnArrayIndex(index, value)
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

const getSetters = R.compose(
  R.binary(R.apply(R.compose)),
  R.map(setter),
  split
)

type SetFunction = (value: Data, object: Data) => Data

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
export default function pathSetter (path: PathString): SetFunction {
  const setters = getSetters(path)

  return (value: Data, object: Data) =>
    R.mergeDeepRight(object, setters(value))
}
