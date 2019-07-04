import { Operands, Data } from '../types'
import getter from '../utils/pathGetter'

interface Options extends Operands {
  path?: string
}

const extractPath = (path: Options | string) =>
  typeof path === 'string' ? path : path.path

export default function get(options: Options | string) {
  const path = extractPath(options) || '.'
  const getFn = getter(path)

  return (data: Data) => getFn(data)
}
