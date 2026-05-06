import transformers from '../transformers/index.js'
import { defToNextStateMapper } from './definitionHelpers.js'
import { noopNext } from './stateHelpers.js'
import type { Options } from '../types.js'

/**
 * Returns a completed options object. Include built-in transformers, but let
 * custom transformers override them. The transformers object is shallow
 * cloned; `pipelines` and `dictionaries` are passed through by reference so
 * that resolved pipelines are shared across `mapTransform()` calls.
 */
export function prepareOptions(options: Options): Options {
  return {
    transformers: { ...transformers, ...options.transformers },
    pipelines: options.pipelines,
    dictionaries: options.dictionaries,
    nonvalues: options.nonvalues ?? [undefined],
    fwdAlias: options.fwdAlias,
    revAlias: options.revAlias,
    modifyOperationObject: options.modifyOperationObject,
    modifyGetValue: options.modifyGetValue,
  }
}

/**
 * Resolve the needed pipelines as operations, mutating the pipelines object
 * in place so the resolved operations are shared across `mapTransform()` calls
 * that pass the same pipelines map.
 */
export function preparePipelines(options: Options): void {
  const { pipelines, neededPipelineIds } = options
  if (pipelines && neededPipelineIds) {
    for (const key of neededPipelineIds) {
      const pipeline = pipelines[key] // eslint-disable-line security/detect-object-injection
      if (typeof pipeline !== 'function') {
        const stateMapper = defToNextStateMapper(pipeline, options)(noopNext)
        pipelines[key] = () => () => stateMapper // eslint-disable-line security/detect-object-injection
      }
    }
  }
}
