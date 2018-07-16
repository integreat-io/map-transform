import * as R from 'ramda'
import * as mapAny from 'map-any'
import { Data, DataWithProps } from '..'
import { PathString } from './lensPath'

const numberOrString = (val: string): string | number => {
  const num = Number.parseInt(val)
  return (Number.isNaN(num)) ? val : num
}

const split = (str: PathString): (string | number)[] =>
  str.split(/\[|]?\.|]/).filter((str) => str !== '').map(numberOrString)

const getProp = (prop: string) => (object?: DataWithProps) =>
  (object) ? object[prop] : undefined

const getArrayIndex = (index: number) => (arr?: Data) =>
  (Array.isArray(arr)) ? arr[index] : undefined

const getter = (prop: string | number) =>
  (typeof prop === 'number') ? getArrayIndex(prop) : mapAny(getProp(prop))

const getGetters = R.compose(
  R.binary(R.apply(R.pipe)),
  R.map(getter),
  split
)

type GetFunction = (object?: Data | null) => Data

/**
 * Get the value at `path` in `object`.
 *
 * Path may be a simple dot notation, and may include array brackets with or
 * without an index specified.
 *
 * @param {string} path - The path to get
 * @returns {function} A function accepting an object to get the value from.
 */
export default function pathGetter (path: PathString | null): GetFunction {
  return (path)
    ? R.ifElse(
        R.isNil,
        R.identity,
        getGetters(path)
      )
    : R.identity
}
