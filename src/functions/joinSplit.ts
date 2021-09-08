import { Operands, DataMapper } from '../types'
import getter from '../utils/pathGetter'
import setter from '../utils/pathSetter'

interface Options extends Operands {
  path?: string | string[]
  sep?: string
}

function joinSplit(
  { path = [], sep = ' ' }: Options,
  split: boolean
): DataMapper {
  const pathArr = ([] as string[]).concat(path)
  const getFns = pathArr.map(getter)
  const setFns = pathArr.map(setter)

  return (data, { rev }) => {
    if (split ? !rev : rev) {
      const values = typeof data === 'string' ? data.split(sep) : []
      let ret = {}
      setFns.forEach((setFn, index) => {
        // eslint-disable-next-line security/detect-object-injection
        ret = setFn(values[index], ret)
      })
      return ret
    } else {
      const values = getFns.map((fn) => fn(data))
      return values.filter((value) => value !== undefined).join(sep)
    }
  }
}

export function join(options: Options): DataMapper {
  return joinSplit(options, false)
}

export function split(options: Options): DataMapper {
  return joinSplit(options, true)
}
