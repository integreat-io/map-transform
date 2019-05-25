import { compose } from 'ramda'
import { MapDefinition, MapTransform, State, StateMapper, Data, Options } from './types'
import { mapFunctionFromDef, isMapObject } from './utils/definitionHelpers'
import { populateState, getStateValue } from './utils/stateHelpers'
import objectToMapFunction from './utils/objectToMapFunction'

export { get, set } from './funcs/getSet'
export { default as root } from './funcs/root'
export { default as alt } from './funcs/alt'
export { default as value } from './funcs/value'
export { default as fixed } from './funcs/fixed'
export { default as concat } from './funcs/concat'
export { default as compare } from './funcs/compare'
export { default as validate } from './funcs/validate'
export { default as not } from './funcs/not'
export { default as plug } from './funcs/plug'
export { default as lookup } from './funcs/lookup'
export { default as transform } from './funcs/transform'
export { default as filter } from './funcs/filter'
export { fwd, rev, divide } from './funcs/directionals'
export { Data, CustomFunction, DataMapper } from './types'

const composeMapFunction = (mapFn: StateMapper, initialState: Partial<State>) => {
  const map = compose(getStateValue, mapFn, populateState(initialState))
  return (data: Data) => (typeof data === 'undefined') ? undefined : map(data)
}

export function mapTransform (def: MapDefinition, options: Options = {}): MapTransform {
  const mapFn = (isMapObject(def)) ? objectToMapFunction(def, options) : mapFunctionFromDef(def, options)

  return Object.assign(
    composeMapFunction(mapFn, {}),
    {
      onlyMappedValues: composeMapFunction(mapFn, { onlyMapped: true }),
      rev: Object.assign(
        composeMapFunction(mapFn, { rev: true }),
        {
          onlyMappedValues: composeMapFunction(mapFn, { rev: true, onlyMapped: true })
        }
      )
    }
  )
}
