import * as R from 'ramda'
import { IPath, IDataWithProps, IDataOrProp } from '../../index.d'

export interface ISetter {
  (value: IDataOrProp, object: IDataWithProps): IDataWithProps
}

const preparePathPart = (part: string, isAfterOpenArray: boolean) =>
  (isAfterOpenArray) ? `*${part}` : part

const pathSplitter = function* (path: IPath) {
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

const split = (path: IPath): string[] => [...pathSplitter(path)]

const setOnObject = (prop: string) => (value: IDataOrProp): IDataOrProp =>
  ({ [prop]: value })

const setOnOpenArray = (value: IDataOrProp) =>
  (Array.isArray(value)) ? value : [value]

const setOnArrayIndex = (index: number, value: IDataOrProp) => {
  const arr = []
  arr[index] = value
  return arr
}

const setOnArray = (prop: string) => (value: IDataOrProp): IDataOrProp => {
  const index = parseInt(prop.substr(1), 10)
  return (isNaN(index))
    ? setOnOpenArray(value)
    : setOnArrayIndex(index, value)
}

const setOnSubArray = (prop: string) => (value: IDataOrProp): IDataOrProp =>
  ([] as IDataOrProp[]).concat(value).map(setOnObject(prop.substr(1)))

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
export default function pathSetter (path: IPath): ISetter {
  const setters = getSetters(path)

  return (value: IDataOrProp, object: IDataWithProps) =>
    R.mergeDeepRight(object, setters(value))
}
