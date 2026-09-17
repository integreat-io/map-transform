import transformers from '../transformers/index.js'
import { toInternalOptions } from './internalOptions.js'
import type { Options, InternalOptions } from '../types.js'

export { getPreparedPipeline, preparePipelines } from './preparedPipelines.js'

type PipelineCache = Pick<
  InternalOptions,
  'neededPipelineIds' | 'preparedPipelines'
>

const pipelineCaches = new WeakMap<Options, PipelineCache>()

function getPipelineCache(options: Options): PipelineCache {
  const cached = pipelineCaches.get(options)
  if (cached) {
    return cached
  }
  // Internal options copied by an operation carry their Set and Map with them
  const { neededPipelineIds, preparedPipelines } = toInternalOptions({
    ...options,
  })
  const cache = { neededPipelineIds, preparedPipelines }
  pipelineCaches.set(options, cache)
  return cache
}

/**
 * Returns a completed options object. Include built-in transformers, but let
 * custom transformers override them. The options object is shallow cloned, so
 * that we never modify the object we're given. `pipelines` and `dictionaries`
 * are passed through by reference.
 *
 * The `neededPipelineIds` Set and `preparedPipelines` Map are cached by options
 * object identity, so calls with the same options object share prepared
 * pipelines. The returned options are registered too, so a transformer calling
 * `mapTransform()` with them shares the same pipelines.
 */
export function prepareOptions(options: Options): InternalOptions {
  const cache = getPipelineCache(options)
  const preppedOptions = {
    ...options,
    transformers: { ...transformers, ...options.transformers },
    nonvalues: options.nonvalues ?? [undefined],
    ...cache,
  }
  pipelineCaches.set(preppedOptions, cache)
  return preppedOptions
}
