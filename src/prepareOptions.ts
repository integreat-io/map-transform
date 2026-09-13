import {
  sync as syncTransformers,
  async as asyncTransformers,
} from './transformers/index.js'
import type { Options } from './prep/index.js'
import type { PreppedPipeline } from './run/index.js'
import type { Transformer, AsyncTransformer } from './typesNext.js'

// Holds the book-keeping for an options object on a symbol key, so that it is
// kept local to this module. Another copy of map-transform will prepare the
// options again instead of trusting ours.
const bookKeeping = Symbol('bookKeeping')

export type Variant = 'sync' | 'async'

// The transformers and the prepared pipelines for one of the two variants. A
// pipeline is prepared with the transformers baked in, so the sync and the
// async variant may never share prepared pipelines.
export interface VariantBookKeeping {
  transformers: Record<string | symbol, Transformer | AsyncTransformer>
  neededPipelineIds: Set<string | symbol>
  pipelines: Map<string | symbol, PreppedPipeline>
}

export type BookKeeping = Record<Variant, VariantBookKeeping>

const createVariant = (
  builtIns: Record<string, Transformer | AsyncTransformer>,
  options: Options,
): VariantBookKeeping => ({
  transformers: { ...builtIns, ...options.transformers },
  neededPipelineIds: new Set(),
  pipelines: new Map(),
})

/**
 * Return the book-keeping for the given options, or `undefined` when the
 * options have not been prepared.
 */
export const getBookKeeping = (options: Options): BookKeeping | undefined =>
  Reflect.get(options, bookKeeping)

/**
 * Set the given book-keeping on the given options object and return it. The
 * book-keeping is not enumerable, so spreading prepared options loses it --
 * everyone making an internal copy has to put it back, to keep sharing the
 * prepared pipelines.
 */
export function withBookKeeping<T extends Options>(
  options: T,
  book: BookKeeping,
): T {
  Object.defineProperty(options, bookKeeping, {
    value: book,
    enumerable: false,
  })
  return options
}

/**
 * Returns a completed options object, ready to be given to `mapTransform()`.
 * The options object is shallow cloned, so we never modify the object we're
 * given. `pipelines` and `dictionaries` are passed through by reference.
 *
 * Prepared options hold the pipelines that have been prepared from the
 * `pipelines` object, so that every pipeline is prepared only once. Call this
 * method up front and pass the returned options to several `mapTransform()`
 * calls, to share prepared pipelines between them. This is opt-in, as pipelines
 * are prepared with the transformers from the options they were prepared with,
 * and may only be shared by transformations that agree on those options.
 *
 * The function is idempotent: options we have already prepared are returned
 * as-is, so preparing them again -- or passing them to `mapTransform()` -- is
 * free.
 */
export default function prepareOptions(options: Options): Options {
  return prepareOptionsWithBookKeeping(options)[0]
}

/**
 * As `prepareOptions()`, but returns the book-keeping along with the options,
 * so that we don't have to look it up again. For internal use.
 */
export function prepareOptionsWithBookKeeping(
  options: Options,
): [Options, BookKeeping] {
  const existing = getBookKeeping(options)
  if (existing) {
    return [options, existing]
  }

  const book: BookKeeping = {
    sync: createVariant(syncTransformers, options),
    async: createVariant(asyncTransformers, options),
  }
  return [withBookKeeping({ ...options }, book), book]
}
