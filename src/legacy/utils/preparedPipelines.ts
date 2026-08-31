import { defToNextStateMapper } from './definitionHelpers.js'
import { noopNext } from './stateHelpers.js'
import type { Operation, InternalOptions, StateMapper } from '../types.js'

// Note: This module must not import `../transformers/index.js` -- directly or
// indirectly -- as it is imported from `operations/apply.js`, which is part of
// the import cycle around `definitionHelpers.js`. Pulling the transformers into
// that cycle leaves them uninitialized. `prepareOptions.js` re-exports from
// here, so it may keep importing the transformers.

/**
 * Returns the pipeline with the given id, resolved to an operation. Prepared
 * pipelines are cached in the `preparedPipelines` Map on the options object, so
 * that every pipeline is resolved only once.
 *
 * The `pipelines` object is never modified. Returns `undefined` when there is
 * no pipeline with the given id.
 */
export function getPreparedPipeline(
  pipelineId: string | symbol,
  options: InternalOptions,
): Operation | undefined {
  const { preparedPipelines } = options
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

  // Cache a lazy operation before we resolve the pipeline, so that a
  // transformer that runs map-transform with our options while we're resolving,
  // won't start resolving this pipeline again. It is replaced by the direct
  // version below, but anyone holding on to it will still reach the resolved
  // state mapper.
  let stateMapper: StateMapper
  preparedPipelines.set(pipelineId, () => () => (state) => stateMapper(state))
  try {
    stateMapper = defToNextStateMapper(pipeline, options)(noopNext)
  } catch (error) {
    preparedPipelines.delete(pipelineId)
    throw error
  }

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
export function preparePipelines(options: InternalOptions): void {
  for (const key of options.neededPipelineIds) {
    getPreparedPipeline(key, options)
  }
}
