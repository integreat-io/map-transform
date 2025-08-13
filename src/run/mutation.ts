import runPipeline, {
  runPipelineAsync,
  PreppedPipeline,
  OperationStepBase,
} from './index.js'
import { isNonvalue } from '../utils/is.js'
import type State from '../state.js'

export interface MutationStep extends OperationStepBase {
  type: 'mutation'
  flip?: boolean
  noDefaults?: boolean
  always?: boolean
  pipelines: PreppedPipeline[]
}

const handOffState = (state: State, target: unknown, flip?: boolean) => ({
  ...state,
  target,
  flip: typeof flip === 'boolean' ? flip : state.flip,
})

/**
 * Run a mutation step, by running each pipeline and combining the results
 * into one object. This is done by giving the result of a pipeline as the
 * target for the next.
 */
export default function runMutationStep(
  value: unknown,
  { pipelines, flip, always }: MutationStep,
  state: State,
) {
  // Don't mutate a non-value, unless `always` is true
  if (!always && isNonvalue(value, state.nonvalues)) {
    return undefined
  }

  // Run every pipeline in turn, with the result of the previous as the target
  // of the next. The first one is given an empty object as target
  return pipelines.reduce(
    (target, pipeline) =>
      runPipeline(value, pipeline, handOffState(state, target, flip)),
    state.noDefaults ? undefined : ({} as unknown),
  )
}

/**
 * Run a mutation step, by running each pipeline and combining the results
 * into one object. This is done by giving the result of a pipeline as the
 * target for the next.
 *
 * This is an async version of `runMutationStep()`.
 */
export async function runMutationStepAsync(
  value: unknown,
  { pipelines, flip }: MutationStep,
  state: State,
) {
  // Don't mutate a non-value
  if (isNonvalue(value, state.nonvalues)) {
    return undefined
  }

  // Run every pipeline in turn, with the result of the previous as the target
  // of the next. The first one is given an empty object as target
  let next: unknown = state.noDefaults ? undefined : {}
  for (const pipeline of pipelines) {
    next = await runPipelineAsync(
      value,
      pipeline,
      handOffState(state, next, flip),
    )
  }
  return next
}
