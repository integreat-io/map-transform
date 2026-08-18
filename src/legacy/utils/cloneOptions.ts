import type { Operation, Options } from '../types.js'

// Note: This module must not import anything but types, as it is imported from
// `definitionHelpers.js`, which is part of an import cycle. See the note in
// `preparedPipelines.js`.

/**
 * Returns a shallow clone of the given options object, with the given changes
 * applied. Everything else -- `pipelines`, `transformers`, `dictionaries`, etc.
 * -- is passed on by reference.
 *
 * The book-keeping props `neededPipelineIds` and `preparedPipelines` are always
 * shared with the original options object, so that pipelines marked as needed
 * or prepared while we're using the clone, are known to the original too. They
 * are created on the original when they are not there yet, as we would
 * otherwise have nothing to share. For this reason, they may not be overridden
 * by `changes`.
 */
export function cloneOptions(
  options: Options,
  changes: Partial<Options> = {},
): Options {
  return {
    ...options,
    ...changes,
    neededPipelineIds: (options.neededPipelineIds ??= new Set<
      string | symbol
    >()),
    preparedPipelines: (options.preparedPipelines ??= new Map<
      string | symbol,
      Operation
    >()),
  }
}
