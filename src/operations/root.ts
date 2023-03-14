import pipe from './pipe.js'
import { TransformDefinition, Operation } from '../types.js'
import { operationsFromDef } from '../utils/definitionHelpers.js'

export default function (def: TransformDefinition): Operation {
  const pipeline = ['^^', operationsFromDef(def)].flat()
  return pipe(pipeline)
}
