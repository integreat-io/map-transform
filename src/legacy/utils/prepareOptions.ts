import transformers from '../transformers/index.js'
import type { Options } from '../types.js'

export { getPreparedPipeline, preparePipelines } from './preparedPipelines.js'

// Marks an options object as prepared. Kept local to this module, so that
// another copy of map-transform will prepare the options again instead of
// trusting our merge.
const isPrepared = Symbol('isPrepared')

/**
 * Returns a completed options object. Include built-in transformers, but let
 * custom transformers override them. The options object is shallow cloned, so
 * that we never modify the object we're given. `pipelines` and `dictionaries`
 * are passed through by reference.
 *
 * The `preparedPipelines` Map holds the pipelines that have been resolved to
 * operations. An existing Map is passed on, so that resolved pipelines may be
 * shared across `mapTransform()` calls. Call this method up front and pass the
 * returned options to several `mapTransform()` calls, to share prepared
 * pipelines intentionally instead of relying on a shared `pipelines` object.
 *
 * The function is idempotent: options we have already prepared are returned
 * as-is, so preparing them again -- or passing them to `mapTransform()` -- is
 * free.
 */
export function prepareOptions(options: Options): Options {
  if (Reflect.get(options, isPrepared)) {
    return options
  }
  const preppedOptions = {
    ...options,
    transformers: { ...transformers, ...options.transformers },
    nonvalues: options.nonvalues ?? [undefined],
    preparedPipelines: options.preparedPipelines ?? new Map(),
  }
  Object.defineProperty(preppedOptions, isPrepared, {
    value: true,
    enumerable: false,
  })
  return preppedOptions
}
