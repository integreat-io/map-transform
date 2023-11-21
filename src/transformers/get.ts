import { pathGetter } from '../operations/getSet.js'
import type { TransformerProps, Transformer } from '../types.js'

export interface Props extends TransformerProps {
  path?: string
}

const extractPath = (path: Props | string) =>
  typeof path === 'string' ? path : path.path

const transformer: Transformer<Props | string> = function get(props) {
  return () => {
    const path = extractPath(props) || '.'
    const mapper = pathGetter(path)
    return (data, state) => mapper(data, state)
  }
}

export default transformer
