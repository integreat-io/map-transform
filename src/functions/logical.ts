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
      ? (a: unknown, b: unknown) => Boolean(a) || Boolean(b)
      : (a: unknown, b: unknown) => Boolean(a) && Boolean(b)

  return (data, { rev }) => {
    if (rev) {
      const value = Boolean(data)
      return setFns.reduce(
        (obj: unknown, setFn) => setFn(value, obj),
        undefined
      )
    } else {
      const values = getFns.map((fn) => fn(data))
      return values.reduce(logicalOp)
    }
  }
}
