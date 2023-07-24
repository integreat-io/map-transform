import pipe from './pipe.js'
import type { TransformDefinition, Operation } from '../types.js'
import { defToOperations } from '../utils/definitionHelpers.js'

export default function (def: TransformDefinition): Operation {
  return (options) => {
    const pipeline = ['^^', defToOperations(def, options)].flat()
    return pipe(pipeline)(options)
  }
}
