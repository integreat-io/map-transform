import { mergeObjects } from './mergeNext.js'
import { ensureArray } from '../utils/array.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'
import { flipState } from '../utils/stateHelpers.js'
import type {
  TransformerProps,
  AsyncTransformer,
  TransformDefinition,
  AsyncDataMapperWithOptions,
} from '../types.js'

export interface Props extends TransformerProps {
  path?: TransformDefinition | TransformDefinition[]
}

// Merge objects, either from an array of paths that points to objects (or
// arrays of objects) or one path that points to an array of objects.
// Any values in the array (after flattening) that are not objects, will be
// skipped.
function mergeTransformer(
  { path }: Props,
  flip: boolean,
): AsyncDataMapperWithOptions {
  return (options) => {
    const getFns = ensureArray(path).map((path) =>
      defToDataMapper(path, options),
    )

    return async function mergePipelines(data, state) {
      const values = []
      for (const fn of getFns) {
        values.push(await fn(data, flipState(state, flip)))
      }
      return mergeObjects(values)
    }
  }
}

/**
 * Merge object resulting from the given array of pipelines (or the result of
 * one pipeline), going forward. In reverse, the pipeline data will be set on
 * the given pipelines.
 */
export const merge: AsyncTransformer<Props> = function merge(props: Props) {
  return mergeTransformer(props, false)
}

/**
 * Merge object resulting from the given array of pipelines (or the result of
 * one pipeline), in reverse. Going forward, the pipeline data will be set on
 * the given pipelines.
 */
export const mergeRev: AsyncTransformer<Props> = function mergeRev(
  props: Props,
) {
  return mergeTransformer(props, true)
}
