import { compose } from 'ramda'
import { MapDefinition, DataMapperWithRev } from './types'
import { mapFunctionFromDef, isMapObject } from './utils/definitionHelpers'
import { populateState, populateRevState, getStateValue } from './utils/stateHelpers'
import objectToMapFunction from './utils/objectToMapFunction'

export { get, set } from './funcs/getSet'
export { default as alt } from './funcs/alt'
export { default as value } from './funcs/value'
export { default as transform, TransformFunction } from './funcs/transform'
export { default as filter, FilterFunction } from './funcs/filter'
export { fwd, rev } from './funcs/directionals'
export { Data } from './types'

export function mapTransform (def: MapDefinition): DataMapperWithRev {
  const mapFn = (isMapObject(def)) ? objectToMapFunction(def) : mapFunctionFromDef(def)

  return Object.assign(
    compose(getStateValue, mapFn, populateState),
    {
      rev: compose(getStateValue, mapFn, populateRevState)
    }
  )
}
