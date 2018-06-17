import * as R from 'ramda'
import { IPath, IDataWithProps, IDataOrProp } from '../../index.d'

export interface IGetter {
  (object?: IDataWithProps | null): IDataOrProp
}

const parseIntIf = (val: string) => {
  const num = Number.parseInt(val)
  return (Number.isNaN(num)) ? val : num
}

const split = (str: IPath): (string | number)[] =>
  str.split(/\[|]?\.|]/).filter((str) => str !== '').map(parseIntIf)

const getProp = (prop: string | number, object?: IDataWithProps) =>
  (object) ? object[prop] : undefined

const getter = (prop: string | number) =>
  (object?: IDataWithProps): IDataOrProp | undefined =>
    (Array.isArray(object) && typeof prop === 'string')
      ? object.map(getter(prop)) : getProp(prop, object)

const getGetters = R.compose(
  R.binary(R.apply(R.pipe)),
  R.map(getter),
  split
)

/**
 * Get the value at `path` in `object`.
 *
 * Path may be a simple dot notation, and may include array brackets with or
 * without an index specified.
 *
 * @param {string} path - The path to get
 * @returns {function} A function accepting an object to get the value from.
 */
export default function pathGetter (path: IPath | null): IGetter {
  return (path)
    ? R.ifElse(
        R.isNil,
        R.identity,
        getGetters(path)
      )
    : R.identity
}
