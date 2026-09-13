import type { Options } from './prep/index.js'
import type { PreppedPipeline } from './run/index.js'
import type { Transformer, AsyncTransformer } from './typesNext.js'

export type Mode = 'sync' | 'async'
type PreparedPipelines = Record<Mode, Map<string | symbol, PreppedPipeline>>

export interface InternalOptions extends Options {
  preparedPipelines: Map<string | symbol, PreppedPipeline>
}

const preparedOptions = new WeakMap<Options, PreparedPipelines>()

const createPreparedPipelines = (): PreparedPipelines => ({
  sync: new Map(),
  async: new Map(),
})

/**
 * Return a copy of the given options that will share prepared pipelines
 * across `mapTransform()` and `mapTransformAsync()` calls. Options that are
 * already prepared are returned as-is.
 */
export default function prepareOptions(options: Options): Options {
  if (preparedOptions.has(options)) {
    return options
  }
  const prepared = { ...options }
  preparedOptions.set(prepared, createPreparedPipelines())
  return prepared
}

/**
 * Return the options used while preparing a pipeline, with the built-in
 * transformers added and the prepared pipelines Map for the given mode set.
 * The returned options are registered as prepared too, so a transformer
 * calling map-transform during preparation shares the same pipelines in
 * either mode.
 */
export function createInternalOptions(
  options: Options,
  mode: Mode,
  transformers: Record<string, Transformer | AsyncTransformer>,
): InternalOptions {
  const prepared = preparedOptions.get(options) ?? createPreparedPipelines()
  const internalOptions = {
    ...options,
    transformers: { ...transformers, ...options.transformers },
    preparedPipelines: mode === 'sync' ? prepared.sync : prepared.async,
  }
  preparedOptions.set(internalOptions, prepared)
  return internalOptions
}
