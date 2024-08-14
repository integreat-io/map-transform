import runPipeline, { PreppedPipeline } from './index.js'
import { isObject } from '../utils/is.js'
import type { Path, State } from '../types.js'

export interface MutationStep {
  type: 'mutation'
  flip?: boolean
  mod?: Path[]
  pipelines: PreppedPipeline[]
}

/**
 * Run a mutation step, by running each pipeline and combining the results
 * into one object. This is done by giving the result of a pipeline as the
 * target for the next. If a `mod` pipeline is given, we'll shallow merge the
 * value it's pointing to with the result from the pipelines, as long as both
 * are objects.
 */
export default function runMutationStep(
  value: unknown,
  { pipelines, mod: modPipeline, flip: ourFlip }: MutationStep,
  state: State,
) {
  const flip = typeof ourFlip === 'boolean' ? ourFlip : state.flip
  // Run every pipeline in turn, with the result of the previous as the target
  // of the next. The first one is given an empty object as target
  const next = pipelines.reduce(
    (target, pipeline) =>
      runPipeline(value, pipeline, { ...state, target, flip }) as Record<
        string,
        unknown
      >,
    {},
  )

  // If we have a mod pipeline and next is an object, we get the value at the
  // mod pipeline and shallow merge with it, if it's an object too
  if (modPipeline && isObject(next)) {
    // TODO: Override direction to fwd, here?
    const modValue = runPipeline(value, modPipeline, state) // TODO: Use a get path only runner instead of running a full pipeline
    if (isObject(modValue)) {
      return { ...modValue, ...next }
    }
  }

  // We're not merging with a mod object -- just return
  return next
}
