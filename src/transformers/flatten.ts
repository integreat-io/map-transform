import type { Transformer, TransformerProps } from '../typesNext.js'

export interface Props extends TransformerProps {
  depth?: number
}

const transformer: Transformer<Props> = function flatten({ depth = 1 }) {
  return () => (data) => (Array.isArray(data) ? data.flat(depth) : data)
}

export default transformer
