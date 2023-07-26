import { isObject } from '../utils/is.js'
import type {
  TransformDefinition,
  DataMapperWithOptions,
  Transformer,
  TransformerProps,
  Options,
} from '../types.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'

export interface Props extends TransformerProps {
  path?: TransformDefinition
}

function dataMapperFromProps(
  props: Props | DataMapperWithOptions,
  options: Options
) {
  if (typeof props === 'function') {
    return props(options)
  } else if (isObject(props)) {
    return defToDataMapper(props.path, options)
  } else {
    return async (value: unknown) => value
  }
}

const transformer: Transformer<Props | DataMapperWithOptions> = function not(
  props
) {
  return (options) => {
    const fn = dataMapperFromProps(props, options)
    return async (value, state) => !(await fn(value, state))
  }
}

export default transformer
