import { compose } from 'ramda'
import { MapDefinition, MapTransform, MapFunction, State } from './types'
import { mapFunctionFromDef, isMapObject } from './utils/definitionHelpers'
import { populateState, getStateValue } from './utils/stateHelpers'
import objectToMapFunction from './utils/objectToMapFunction'

export { get, set } from './funcs/getSet'
export { default as alt } from './funcs/alt'
export { default as value } from './funcs/value'
export { default as transform, TransformFunction } from './funcs/transform'
export { default as filter, FilterFunction } from './funcs/filter'
export { fwd, rev } from './funcs/directionals'
export { Data } from './types'

const composeMapFunction = (mapFn: MapFunction, initialState: Partial<State>) =>
  compose(getStateValue, mapFn, populateState(initialState))

export function mapTransform (def: MapDefinition): MapTransform {
  const mapFn = (isMapObject(def)) ? objectToMapFunction(def) : mapFunctionFromDef(def)

  return Object.assign(
    composeMapFunction(mapFn, {}),
    {
      rev: composeMapFunction(mapFn, { rev: true }),
      onlyMappedValues: Object.assign(
        composeMapFunction(mapFn, { onlyMapped: true }),
        {
          rev: composeMapFunction(mapFn, { rev: true, onlyMapped: true })
        }
      )
    }
  )
}
