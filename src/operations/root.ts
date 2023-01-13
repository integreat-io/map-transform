import pipe from './pipe.js'
import { MapDefinition, Operation } from '../types.js'
import { operationsFromDef } from '../utils/definitionHelpers.js'

export default function (def: MapDefinition): Operation {
  const pipeline = ['^^', operationsFromDef(def)].flat()
  return pipe(pipeline)
}
