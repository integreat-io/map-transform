import { compose } from 'ramda'
import {
  MapDefinition,
  MapTransform,
  State,
  StateMapper,
  Data,
  Options
} from './types'
import { mapFunctionFromDef } from './utils/definitionHelpers'
import { populateState, getStateValue } from './utils/stateHelpers'
import functionsObject from './functions'

export { get, set } from './operations/getSet'
export { default as root } from './operations/root'
export { default as alt } from './operations/alt'
export { default as apply } from './operations/apply'
export { default as value } from './operations/value'
export { default as fixed } from './operations/fixed'
export { default as concat } from './operations/concat'
export { default as validate } from './functions/validate'
export { default as not } from './functions/not'
export { default as plug } from './operations/plug'
export { default as lookup } from './operations/lookup'
export { default as transform } from './operations/transform'
export { default as filter } from './operations/filter'
export { fwd, rev, divide } from './operations/directionals'
export { Data, CustomFunction, DataMapper, MapDefinition } from './types'
export const functions = functionsObject

const composeMapFunction = (
  mapFn: StateMapper,
  initialState: Partial<State>
) => {
  const map = compose(
    getStateValue,
    mapFn,
    populateState(initialState)
  )
  return (data: Data) => (typeof data === 'undefined' ? undefined : map(data))
}

const mergeOptions = (options: Options) => ({
  ...options,
  functions: {
    ...functions,
    ...(options.functions || {})
  }
})

export function mapTransform(
  def: MapDefinition,
  options: Options = {}
): MapTransform {
  const preparedOptions = mergeOptions(options)
  const mapFn = mapFunctionFromDef(def, preparedOptions)

  return Object.assign(composeMapFunction(mapFn, {}), {
    onlyMappedValues: composeMapFunction(mapFn, { onlyMapped: true }),
    rev: Object.assign(composeMapFunction(mapFn, { rev: true }), {
      onlyMappedValues: composeMapFunction(mapFn, {
        rev: true,
        onlyMapped: true
      })
    })
  })
}
