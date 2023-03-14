import { TransformDefinition, DataMapperEntry, Options } from './types.js'
import { operationFromDef } from './utils/definitionHelpers.js'
import { populateState, getStateValue } from './utils/stateHelpers.js'
import transformers from './transformers/index.js'
import iterate from './operations/iterate.js'
import { identity } from './utils/functional.js'

export { get, set } from './operations/getSet.js'
export { default as root } from './operations/root.js'
export { default as alt } from './operations/alt.js'
export { default as apply } from './operations/apply.js'
export { default as concat } from './operations/concat.js'
export { default as not } from './transformers/not.js'
export { default as plug } from './operations/plug.js'
export { default as lookup } from './operations/lookup.js'
export { default as transform } from './operations/transform.js'
export { default as filter } from './operations/filter.js'
export { default as ifelse } from './operations/ifelse.js'
export { fwd, rev, divide } from './operations/directionals.js'
export { default as merge } from './operations/merge.js'
export { default as modify } from './operations/modify.js'
export { iterate, transformers }

const mergeOptions = (options: Options) => ({
  ...options,
  transformers: {
    ...transformers,
    ...(options.transformers || {}),
  },
})

export default function mapTransform(
  def: TransformDefinition,
  options: Options = {}
): DataMapperEntry {
  const completeOptions = mergeOptions(options)
  const stateMapper = operationFromDef(def)(completeOptions)(identity)

  return function transform(data, initialState) {
    if (data === undefined) {
      return undefined
    }
    return getStateValue(stateMapper(populateState(data, initialState || {})))
  }
}
