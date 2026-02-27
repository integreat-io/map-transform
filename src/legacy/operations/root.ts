import { pipeNext } from './pipe.js'
import { getSetParentOrRoot } from './getSet.js'
import { defToNextStateMappers } from '../utils/definitionHelpers.js'
import type { TransformDefinition, Operation } from '../types.js'

export default function (def: TransformDefinition): Operation {
  return (options) => {
    const pipeline = [
      getSetParentOrRoot('^^', false)(options),
      defToNextStateMappers(def, options),
    ].flat()
    return pipeNext(pipeline)
  }
}
