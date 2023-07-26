import { divide, fwd } from './directionals.js'
import iterate from './iterate.js'
import transform from './transform.js'
import flatten from '../transformers/flatten.js'
import { defToOperations } from '../utils/definitionHelpers.js'
import xor from '../utils/xor.js'
import { setValueFromState } from '../utils/stateHelpers.js'
import type { Pipeline, Operation, StateMapper } from '../types.js'

interface Fn {
  (next: StateMapper): StateMapper
}

const composeFn = (...fns: Fn[]): Fn =>
  fns.reduceRight(
    (f, g) =>
      (...args) =>
        g(f(...args))
  )

const pipeFn = (...fns: Fn[]): Fn =>
  fns.reduce(
    (f, g) =>
      (...args) =>
        g(f(...args))
  )

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
        ])
      )
      pipeline.push(fwd(transform(flatten({ depth: 1 }))))
      break
    } else {
      pipeline.push(step)
    }
  }

  return pipeline
}

export default function pipe(
  defs?: Pipeline,
  doReturnContext = false
): Operation {
  return (options) => {
    if (!Array.isArray(defs) || defs.length === 0) {
      return () => async (state) => state
    }

    const fns = splitArrayPaths(defs)
      .flat()
      .flatMap((def) => defToOperations(def, options))
      .map((fn) => fn(options))

    return (next) => {
      const run = pipeFn(...fns)(next)
      const runRev = composeFn(...fns)(next)
      return async function doPipe(state) {
        const isRev = xor(state.rev, state.flip)
        const thisState = isRev ? await runRev(state) : await run(state)
        return doReturnContext ? thisState : setValueFromState(state, thisState)
      }
    }
  }
}
