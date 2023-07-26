import pipe from './pipe.js'
import { get } from './getSet.js'
import { defToOperations } from '../utils/definitionHelpers.js'
import type { TransformDefinition, Operation } from '../types.js'

export default function (def: TransformDefinition): Operation {
  return (options) => {
    const pipeline = [get('^^'), defToOperations(def, options)].flat()
    return pipe(pipeline)(options)
  }
}
