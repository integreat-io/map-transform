import { Operands, Data } from '../types'
import getter from '../utils/pathGetter'

interface Options extends Operands {
  path?: string
}

export default function get ({ path = '.' }: Options) {
  const getFn = getter(path)

  return (data: Data) => getFn(data)
}
