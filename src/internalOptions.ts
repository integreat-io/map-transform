import type { Options } from './prep/index.js'
import type { PreppedPipeline } from './run/index.js'
import type { Transformer, AsyncTransformer } from './typesNext.js'

export type Mode = 'sync' | 'async'
type PreparedPipelines = Record<Mode, Map<string | symbol, PreppedPipeline>>

export interface InternalOptions extends Options {
  preparedPipelines: Map<string | symbol, PreppedPipeline>
}

const preparedOptions = new WeakMap<Options, PreparedPipelines>()

export const isInternalOptions = (
  options: Options,
): options is InternalOptions =>
  'preparedPipelines' in options && options.preparedPipelines instanceof Map

const createPreparedPipelines = (): PreparedPipelines => ({
  sync: new Map(),
  async: new Map(),
})

/**
 * Return the options used while preparing a pipeline, with the built-in
 * transformers added and the prepared pipelines Map for the given mode set.
 * The Maps are cached by options object identity, so calls with the same
 * options share prepared pipelines. The returned options are registered too,
 * so a transformer calling map-transform during preparation shares the same
 * pipelines in either mode.
 */
export function createInternalOptions(
  options: Options,
  mode: Mode,
  transformers: Record<string, Transformer | AsyncTransformer>,
): InternalOptions {
  let prepared = preparedOptions.get(options)
  if (!prepared) {
    prepared = createPreparedPipelines()
    preparedOptions.set(options, prepared)
  }
  const internalOptions = {
    ...options,
    transformers: { ...transformers, ...options.transformers },
    preparedPipelines: mode === 'sync' ? prepared.sync : prepared.async,
  }
  preparedOptions.set(internalOptions, prepared)
  return internalOptions
}
