import type { Operation, Options, InternalOptions } from '../types.js'

// Note: This module must not import anything but types, as it is imported from
// `definitionHelpers.js`, which is part of an import cycle. See the note in
// `preparedPipelines.js`.

/**
 * Returns the given options with the book-keeping props `neededPipelineIds` and
 * `preparedPipelines` in place. They are set on the options object we're given,
 * so that everyone holding on to it -- the caller included -- shares the same
 * Set and Map. Options from `prepareOptions()` already have them.
 */
export function toInternalOptions(options: Options): InternalOptions {
  const internalOptions = options as InternalOptions
  internalOptions.neededPipelineIds ??= new Set<string | symbol>()
  internalOptions.preparedPipelines ??= new Map<string | symbol, Operation>()
  return internalOptions
}
