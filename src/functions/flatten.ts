import { DataMapper } from '../types'

interface Operands extends Record<string, unknown> {
  depth?: number
}

export default function flatten({ depth = 1 }: Operands): DataMapper {
  return (data, _state) => (Array.isArray(data) ? data.flat(depth) : data)
}
