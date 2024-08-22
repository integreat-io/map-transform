import {
  createDataMapper,
  createDataMapperAsync,
  DataMapper,
  DataMapperAsync,
} from '../createDataMapper.js'
import type {
  TransformDefinition,
  Options as OptionsNext,
} from '../prep/index.js'
import type {
  AsyncTransformer,
  State,
  Transformer,
  TransformerProps,
} from '../types.js'

export interface Props extends TransformerProps {
  path?: TransformDefinition
}

function createTransformerSync(getFn: DataMapper) {
  return function not(value: unknown, state: State) {
    return !getFn(value, state)
  }
}

function createTransformerAsync(getFn: DataMapperAsync) {
  return async function not(value: unknown, state: State) {
    return !(await getFn(value, state))
  }
}

/**
 * Performs a logical not on the value in the pipeline or on the value returned
 * by the `path` pipeline if one is set.
 *
 * This version does not support async pipelines.
 */
export const not: Transformer =
  ({ path = null }: Props) =>
  (options) => {
    const getFn = createDataMapper(path, options as OptionsNext)
    return createTransformerSync(getFn)
  }

/**
 * Performs a logical not on the value in the pipeline or on the value returned
 * by the `path` pipeline if one is set.
 *
 * This version supports async pipelines.
 */
export const notAsync: AsyncTransformer =
  ({ path = null }: Props) =>
  (options) => {
    const getFn = createDataMapperAsync(path, options as OptionsNext)
    return createTransformerAsync(getFn)
  }
