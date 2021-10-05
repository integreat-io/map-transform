import { Operands, Path, DataMapper } from '../types'
import getter from '../utils/pathGetter'
import setter from '../utils/pathSetter'

interface CompareOperands extends Operands {
  path?: Path | Path[]
  operator?: string
}

export default function compare({
  path = '.',
  operator = 'AND',
}: CompareOperands): DataMapper {
  const pathArr = ([] as string[]).concat(path)
  const getFns = pathArr.map(getter)
  const setFns = pathArr.map(setter)
  const logicalOp =
    operator === 'OR'
      ? (a: boolean, b: boolean) => Boolean(a) || Boolean(b)
      : (a: boolean, b: boolean) => Boolean(a) && Boolean(b)

  return (data, { rev }) => {
    if (rev) {
      let ret = {}
      const value = Boolean(data)
      setFns.forEach((setFn) => {
        ret = setFn(value, ret)
      })
      return ret
    } else {
      const values = getFns.map((fn) => fn(data))
      return values.reduce(logicalOp)
    }
  }
}
