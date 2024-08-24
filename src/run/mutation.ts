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
  pipelines: PreppedPipeline[]
}

const overrideFlag = (our?: boolean, their?: boolean) =>
  typeof our === 'boolean' ? our : their

const handOffState = (
  state: State,
  target: unknown,
  flip?: boolean,
  noDefaults?: boolean,
) => ({
  ...state,
  target,
  flip: overrideFlag(flip, state.flip),
  noDefaults: overrideFlag(noDefaults, state.noDefaults),
})

/**
 * Run a mutation step, by running each pipeline and combining the results
 * into one object. This is done by giving the result of a pipeline as the
 * target for the next. If a `mod` pipeline is given, we'll shallow merge the
 * value it's pointing to with the result from the pipelines, as long as both
 * are objects.
 */
export default function runMutationStep(
  value: unknown,
  { pipelines, flip, noDefaults }: MutationStep,
  state: State,
) {
  // Don't mutate a non-value
  if (isNonvalue(value, state.nonvalues)) {
    return undefined
  }

  // Run every pipeline in turn, with the result of the previous as the target
  // of the next. The first one is given an empty object as target
  return pipelines.reduce(
    (target, pipeline) =>
      runPipeline(
        value,
        pipeline,
        handOffState(state, target, flip, noDefaults),
      ) as Record<string, unknown>,
    {},
  )
}

/**
 * Run a mutation step, by running each pipeline and combining the results
 * into one object. This is done by giving the result of a pipeline as the
 * target for the next. If a `mod` pipeline is given, we'll shallow merge the
 * value it's pointing to with the result from the pipelines, as long as both
 * are objects.
 *
 * This is an async version of `runMutationStep()`.
 */
export async function runMutationStepAsync(
  value: unknown,
  { pipelines, flip, noDefaults }: MutationStep,
  state: State,
) {
  // Don't mutate a non-value
  if (isNonvalue(value, state.nonvalues)) {
    return undefined
  }

  // Run every pipeline in turn, with the result of the previous as the target
  // of the next. The first one is given an empty object as target
  let next: unknown = {}
  for (const pipeline of pipelines) {
    next = await runPipelineAsync(
      value,
      pipeline,
      handOffState(state, next, flip, noDefaults),
    )
  }
  return next
}
