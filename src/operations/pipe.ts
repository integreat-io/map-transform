import { divide, fwd } from './directionals.js'
import iterate from './iterate.js'
import transform from './transform.js'
import flatten from '../transformers/flatten.js'
import { defToNextStateMappers } from '../utils/definitionHelpers.js'
import { setValueFromState, revFromState } from '../utils/stateHelpers.js'
import type { Pipeline, Operation, StateMapper, State } from '../types.js'

interface Fn {
  (next: StateMapper): StateMapper
}

const chain = (next: StateMapper, fn: Fn) => fn(next)

// Run through a pipeline def and split up any paths with open array brackets
// in the middle. The path after the brackets will be iterated along with the
// rest of the pipeline, and then flattened – in the forward direction. Nothing
// will happen in reverse.
function splitArrayPaths(defs: Pipeline) {
  const pipeline: Pipeline = []

  for (const [index, step] of defs.entries()) {
    if (typeof step === 'string' && step.includes('[].')) {
      const pos = step.indexOf('[].')
      pipeline.push(step.slice(0, pos + 2))
      pipeline.push(
        divide(iterate([step.slice(pos + 3), ...defs.slice(index + 1)]), [
          step.slice(pos + 3),
          ...defs.slice(index + 1),
        ]),
      )
      pipeline.push(fwd(transform(flatten({ depth: 1 }))))
      break
    } else {
      pipeline.push(step)
    }
  }

  return pipeline
}

function createPipeFn(
  runFwd: StateMapper,
  runRev: StateMapper,
  doReturnContext: boolean,
) {
  return async function doPipe(state: State) {
    const thisState = revFromState(state)
      ? await runRev(state)
      : await runFwd(state)
    return doReturnContext ? thisState : setValueFromState(state, thisState)
  }
}

export default function pipe(
  defs?: Pipeline,
  doReturnContext = false,
): Operation {
  return (options) => {
    if (!Array.isArray(defs) || defs.length === 0) {
      return () => async (state) => state
    }

    const fns = splitArrayPaths(defs)
      .flat()
      .flatMap((def) => defToNextStateMappers(def, options))

    return (next) => {
      const runFwd = fns.reduce(chain, next)
      const runRev = fns.reduceRight(chain, next)

      return createPipeFn(runFwd, runRev, doReturnContext)
    }
  }
}
