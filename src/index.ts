import { compose } from 'ramda'
import { MapDefinition, DataMapper } from './types'
import { mapFunctionFromDef } from './utils/definitionHelpers'
import { populateState, getValue } from './utils/stateHelpers'

export { default as alt } from './funcs/alt'
export { default as value } from './funcs/value'

export function mapTransform (def: MapDefinition): DataMapper {
  return compose(
    getValue,
    mapFunctionFromDef(def),
    populateState
  )
}
