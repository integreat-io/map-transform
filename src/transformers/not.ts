import { isObject } from '../utils/is.js'
import type {
  TransformDefinition,
  DataMapperWithOptions,
  AsyncDataMapperWithOptions,
  DataMapperWithState,
  AsyncDataMapperWithState,
  AsyncTransformer,
  TransformerProps,
  Options,
} from '../types.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'

export interface Props extends TransformerProps {
  path?: TransformDefinition
}

function dataMapperFromProps(
  props: Props | DataMapperWithOptions | AsyncDataMapperWithOptions,
  options: Options
): DataMapperWithState | AsyncDataMapperWithState {
  if (typeof props === 'function') {
    return props(options)
  } else if (isObject(props)) {
    return defToDataMapper(props.path, options)
  } else {
    return (value: unknown) => value
  }
}

const transformer: AsyncTransformer<
  Props | DataMapperWithOptions | AsyncDataMapperWithOptions
> = function not(props) {
  return (options) => {
    const fn = dataMapperFromProps(props, options)
    return async (value, state) => !(await fn(value, state))
  }
}

export default transformer
