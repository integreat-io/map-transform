import pipe from './pipe'
import { MapDefinition, Operation } from '../types'
import { operationsFromDef } from '../utils/definitionHelpers'

export default function (def: MapDefinition): Operation {
  const pipeline = ['^^', operationsFromDef(def)].flat()
  return pipe(pipeline)
}
