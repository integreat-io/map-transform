import { compose } from 'ramda'
import { MapDefinition, DataMapperWithRev } from './types'
import { mapFunctionFromDef } from './utils/definitionHelpers'
import { populateState, populateRevState, getValue } from './utils/stateHelpers'

export { default as alt } from './funcs/alt'
export { default as value } from './funcs/value'
export { default as transform, TransformFunction } from './funcs/transform'
export { default as filter, FilterFunction } from './funcs/filter'
export { Data } from './types'

export function mapTransform (def: MapDefinition): DataMapperWithRev {
  const mapFn = mapFunctionFromDef(def)

  return Object.assign(
    compose(getValue, mapFn, populateState),
    {
      rev: compose(getValue, mapFn, populateRevState)
    }
  )
}
