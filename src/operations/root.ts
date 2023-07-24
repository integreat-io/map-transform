import pipe from './pipe.js'
import type { TransformDefinition, Operation } from '../types.js'
import { defToOperations } from '../utils/definitionHelpers.js'

export default function ({ def }: { def: TransformDefinition }): Operation {
  const pipeline = ['^^', defToOperations(def)].flat()
  return pipe(pipeline)
}
