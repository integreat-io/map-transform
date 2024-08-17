import runPipeline, { runPipelineAsync } from './index.js'
import type State from '../state.js'

export interface ApplyStep {
  type: 'apply'
  id: string
}

function getPipeline(state: State, id: string) {
  const pipeline = state.pipelines.get(id)

  if (!pipeline) {
    throw new Error(`Pipeline '${id}' does not exist`)
  }

  return pipeline
}

const clearFlip = (state: State) => {
  return { ...state, context: state.context, flip: false }
}

/**
 * Run a pipeline by id. If no pipeline is found, an error is thrown, although
 * this should never happen as the pipelines are already prepared in the
 * prepare step. The flip flag is not passed on from any parent mutation
 * objects.
 */
export default function runApplyStep(
  value: unknown,
  { id }: ApplyStep,
  state: State,
) {
  const pipeline = getPipeline(state, id)
  return runPipeline(value, pipeline, clearFlip(state))
}

/**
 * Run a pipeline by id. If no pipeline is found, an error is thrown, although
 * this should never happen as the pipelines are already prepared in the
 * prepare step. The flip flag is not passed on from any parent mutation
 * objects.
 *
 * This is an async version of `runApplyStep()`.
 */
export async function runApplyStepAsync(
  value: unknown,
  { id }: ApplyStep,
  state: State,
) {
  const pipeline = getPipeline(state, id)
  return await runPipelineAsync(value, pipeline, clearFlip(state))
}
