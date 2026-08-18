import type {
  TransformDefinition,
  DataMapper,
  Options,
  InitialState,
} from './types.js'
import { defToNextStateMapper } from './utils/definitionHelpers.js'
import { prepareOptions, preparePipelines } from './utils/prepareOptions.js'
import { populateState, getStateValue, noopNext } from './utils/stateHelpers.js'

/**
 * @deprecated Use `mapTransformAsync` or `mapTransformSync` instead.
 *
 * Return a function that will transform data according to the given transform
 * definition, and with the provided options. The returned function will also
 * accept an optional initial state, that will be used as a starting point for
 * the transformation.
 */
export default function mapTransform(
  def: TransformDefinition,
  options: Options = {},
): DataMapper<InitialState> {
  const internalOptions = prepareOptions(options)
  const stateMapper = defToNextStateMapper(def, internalOptions)(noopNext)

  // Resolve all needed pipelines and set them on the `preparedPipelines` Map.
  preparePipelines(internalOptions)

  return async function transform(data, initialState) {
    const nextState = await stateMapper(populateState(data, initialState || {}))
    return getStateValue(nextState)
  }
}
