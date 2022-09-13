/* eslint-disable security/detect-object-injection */
import { Operands as BaseOperands, DataMapper } from '../types'
import getter from '../utils/pathGetter'
import setter from '../utils/pathSetter'
import xor from '../utils/xor'
import { ensureArray } from '../utils/array'

interface Operands extends BaseOperands {
  path?: string | string[]
  sep?: string
}

function joinSplit({ path, sep = ' ' }: Operands, split: boolean): DataMapper {
  const pathArr = ensureArray(path)
  if (pathArr.length === 0) {
    return (data, { rev }) =>
      xor(split, rev)
        ? typeof data === 'string'
          ? data.split(sep)
          : undefined
        : Array.isArray(data)
        ? data.join(sep)
        : undefined
  }

  const getFns = pathArr.map(getter)
  const setFns = pathArr.map(setter)

  return (data, { rev }) => {
    if (xor(split, rev)) {
      const values = typeof data === 'string' ? data.split(sep) : []
      return setFns.reduce(
        (obj: unknown, setFn, index) => setFn(values[index], obj),
        undefined
      )
    } else {
      const values = getFns.map((fn) => fn(data))
      return values.filter((value) => value !== undefined).join(sep)
    }
  }
}

export function join(options: Operands): DataMapper {
  return joinSplit(options, false)
}

export function split(options: Operands): DataMapper {
  return joinSplit(options, true)
}
