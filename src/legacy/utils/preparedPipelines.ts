import { defToNextStateMapper } from './definitionHelpers.js'
import { noopNext } from './stateHelpers.js'
import type { Operation, Options } from '../types.js'

// Note: This module must not import `../transformers/index.js` -- directly or
// indirectly -- as it is imported from `operations/apply.js`, which is part of
// the import cycle around `definitionHelpers.js`. Pulling the transformers into
// that cycle leaves them uninitialized. `prepareOptions.js` re-exports from
// here, so it may keep importing the transformers.

/**
 * Returns the pipeline with the given id, resolved to an operation. Prepared
 * pipelines are cached in the `preparedPipelines` Map on the options object, so
 * that every pipeline is resolved only once. The Map is created when it's not
 * already there.
 *
 * The `pipelines` object is never modified. Returns `undefined` when there is
 * no pipeline with the given id.
 */
export function getPreparedPipeline(
  pipelineId: string | symbol,
  options: Options,
): Operation | undefined {
  const preparedPipelines =
    options.preparedPipelines ?? (options.preparedPipelines = new Map())

  const prepared = preparedPipelines.get(pipelineId)
  if (prepared) {
    return prepared
  }

  const pipeline = options.pipelines?.[pipelineId] // eslint-disable-line security/detect-object-injection
  if (pipeline === undefined) {
    return undefined
  }
  if (typeof pipeline === 'function') {
    // Already an operation -- cache it to avoid resolving it again
    preparedPipelines.set(pipelineId, pipeline)
    return pipeline
  }

  const stateMapper = defToNextStateMapper(pipeline, options)(noopNext)
  const operation: Operation = () => () => stateMapper
  preparedPipelines.set(pipelineId, operation)
  return operation
}

/**
 * Resolve the needed pipelines as operations, and set them on the
 * `preparedPipelines` Map. Resolving a pipeline may mark more pipelines as
 * needed, and as a `Set` will yield values added while we're iterating it,
 * these will be resolved too.
 */
export function preparePipelines(options: Options): void {
  const { neededPipelineIds } = options
  if (neededPipelineIds) {
    for (const key of neededPipelineIds) {
      getPreparedPipeline(key, options)
    }
  }
}
