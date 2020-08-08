import { Operands, DataMapper } from '../types'
import getter from '../utils/pathGetter'

interface Options extends Operands {
  path?: string | string[]
  sep?: string
}

export default function join({ path = [], sep = ' ' }: Options): DataMapper {
  const getFns = ([] as string[]).concat(path).map(getter)

  return (data) => {
    const values = getFns.map((fn) => fn(data))
    return values.filter((value) => typeof value !== 'undefined').join(sep)
  }
}
