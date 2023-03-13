import {
  MapDefinition,
  MapTransform,
  State,
  StateMapper,
  Options,
} from './types.js'
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
export { default as validate } from './transformers/validate.js'
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

const composeMapFunction = (
  mapFn: StateMapper,
  initialState: Partial<State>
) => {
  const createState = populateState(initialState)

  return (data: unknown) =>
    data === undefined ? undefined : getStateValue(mapFn(createState(data)))
}

const mergeOptions = (options: Options) => ({
  ...options,
  transformers: {
    ...transformers,
    ...(options.transformers || {}),
  },
})

export default function mapTransform(
  def: MapDefinition,
  options: Options = {}
): MapTransform {
  const completeOptions = mergeOptions(options)
  const mapFn = operationFromDef(def)(completeOptions)(identity)

  return Object.assign(composeMapFunction(mapFn, {}), {
    rev: Object.assign(composeMapFunction(mapFn, { rev: true }), {}),
  })
}
