import R = require('ramda')
import { Data, ObjectWithProps, Path } from '../types'
import { isPath } from './definitionHelpers'

const numberOrString = (val: string): string | number => {
  const num = Number.parseInt(val, 10)
  return Number.isNaN(num) ? val : num
}

const split = (str: Path): (string | number)[] =>
  str
    .split(/\[|]?\.|]/)
    .filter(str => str !== '')
    .map(numberOrString)

const getProp = (prop: string) => (object?: ObjectWithProps) =>
  object ? object[prop] : undefined

const getArrayIndex = (index: number) => (arr?: Data) =>
  Array.isArray(arr) ? arr[index] : undefined

const getObjectOrArray = (fn: (object?: ObjectWithProps) => any) => (
  object?: ObjectWithProps
) => (Array.isArray(object) ? R.flatten(object.map(fn)) : fn(object))

const getter = (prop: string | number) =>
  typeof prop === 'number'
    ? getArrayIndex(prop)
    : getObjectOrArray(getProp(prop))

const getGetters = R.compose(
  R.ifElse(R.isEmpty, R.always(R.identity), R.apply(R.pipe)),
  R.map(getter),
  split
)

const ensureArray = (value: any) =>
  Array.isArray(value) || typeof value === 'undefined'
    ? value
    : value === null
    ? []
    : [value]

export type GetFunction = (object?: Data | null) => Data

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
    const fn = getGetters(path)
    return path.includes('[]')
      ? R.compose(
          ensureArray,
          fn
        )
      : fn
  }
  return R.identity
}
