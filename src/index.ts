import type {
  TransformDefinition,
  DataMapper,
  Options,
  InitialState,
} from './types.js'
import { defToNextStateMapper } from './utils/definitionHelpers.js'
import { populateState, getStateValue, noopNext } from './utils/stateHelpers.js'
import transformers from './transformers/index.js'
import iterate from './operations/iterate.js'

export { default as apply } from './operations/apply.js'
export { concat, concatRev } from './operations/concat.js'
export { default as alt } from './operations/alt.js'
export { fwd, rev, divide } from './operations/directionals.js'
export { default as filter } from './operations/filter.js'
export { get, set, pathGetter, pathSetter } from './operations/getSet.js'
export { default as ifelse } from './operations/ifelse.js'
export { lookup, lookdown } from './operations/lookup.js'
export { default as merge } from './operations/merge.js'
export { default as modify } from './operations/modify.js'
export { default as plug } from './operations/plug.js'
export { default as root } from './operations/root.js'
export { default as transform } from './operations/transform.js'
export { iterate, transformers }

const mergeOptions = (options: Options) => ({
  ...options,
  transformers: {
    ...transformers,
    ...(options.transformers || {}),
  },
})

/**
 * Return a function that will transform data according to the given transform
 * definition, and with the provided options. The returned function will also
 * accept an optional initial state, that will be used as a starting point for
 * the transformation.
 */
export default function mapTransform(
  def: TransformDefinition,
  options: Options = {},
): DataMapper<InitialState> {
  const completeOptions = mergeOptions(options)
  const stateMapper = defToNextStateMapper(def, completeOptions)(noopNext)

  return async function transform(data, initialState) {
    const nextState = await stateMapper(populateState(data, initialState || {}))
    return getStateValue(nextState)
  }
}
