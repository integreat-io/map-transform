import StateClass from '../../state.js'
import { createPathGetter } from '../createPathMapper.js'
import type { TransformerProps, Transformer } from '../types.js'

export interface Props extends TransformerProps {
  path?: string
}

const extractPath = (path: Props | string) =>
  typeof path === 'string' ? path : path.path

const transformer: Transformer<Props | string> = function get(props) {
  return () => {
    const path = extractPath(props) || '.'
    if (typeof path !== 'string' && path !== undefined) {
      throw new TypeError(
        "The 'get' transformer does not allow `path` to be a pipeline",
      )
    }

    const mapper = createPathGetter(path)
    return (data, state) => mapper(data, new StateClass(state))
  }
}

export default transformer
