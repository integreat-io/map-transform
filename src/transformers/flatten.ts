import { DataMapper, TransformerProps } from '../types.js'

interface Props extends TransformerProps {
  depth?: number
}

export default function flatten({ depth = 1 }: Props): DataMapper {
  return (data, _state) => (Array.isArray(data) ? data.flat(depth) : data)
}
