import transformers from '../transformers/index.js'
import { defToNextStateMapper } from './definitionHelpers.js'
import { noopNext } from './stateHelpers.js'
import type { Options } from '../types.js'

/**
 * Returns a completed options object. Include built-in transformers, but let
 * custom transformers override them. We are shallow cloning transformers,
 * pipelines, and dictionaries objects.
 */
export function prepareOptions(options: Options): Options {
  return {
    transformers: { ...transformers, ...options.transformers },
    pipelines: { ...options.pipelines },
    dictionaries: { ...options.dictionaries },
    nonvalues: options.nonvalues ?? [undefined],
    fwdAlias: options.fwdAlias,
    revAlias: options.revAlias,
    modifyOperationObject: options.modifyOperationObject,
    modifyGetValue: options.modifyGetValue,
  }
}

/**
 * Remove unneeded pipelines and resolve the needed ones as operations. We are
 * directly manipulating here to make sure any operation using the pipelines
 * object get the changes. This is okay, as we have shallow cloned the pipelines
 * object and are not mutating the object passed in.
 */
export function preparePipelines(options: Options): void {
  const { pipelines, neededPipelineIds } = options
  if (pipelines && neededPipelineIds) {
    // Resolve all needed pipelines to operations
    for (const key of neededPipelineIds) {
      const pipeline = pipelines[key] // eslint-disable-line security/detect-object-injection
      if (typeof pipeline === 'function') {
        // We already have a function, just register it
        pipelines[key] = pipeline // eslint-disable-line security/detect-object-injection
      } else {
        // This is a pipeline of some sort. Resolve it and register it as an operation
        const stateMapper = defToNextStateMapper(pipeline, options)(noopNext)
        pipelines[key] = () => () => stateMapper // eslint-disable-line security/detect-object-injection
      }
    }

    // Remove unneeded pipelines
    for (const key of Reflect.ownKeys(pipelines)) {
      if (!neededPipelineIds.has(key)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete pipelines[key] // eslint-disable-line security/detect-object-injection
      }
    }
  }
}
