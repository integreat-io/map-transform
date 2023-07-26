import type { TransformerProps, AsyncTransformer } from '../types.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'

export interface Props extends TransformerProps {
  path?: string
}

const extractPath = (path: Props | string) =>
  typeof path === 'string' ? path : path.path

const transformer: AsyncTransformer<Props | string> = function get(props) {
  return (options) => {
    const path = extractPath(props) || '.'
    const mapper = defToDataMapper(path, options)
    return async (data, state) => await mapper(data, state)
  }
}

export default transformer
