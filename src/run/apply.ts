import runPipeline, { runPipelineAsync, OperationStepBase } from './index.js'
import type State from '../state.js'

export interface ApplyStep extends OperationStepBase {
  type: 'apply'
  id: string | symbol
}

function getPipeline(state: State, id: string | symbol) {
  const pipeline = state.pipelines.get(id)

  if (!pipeline) {
    throw new Error(`Pipeline '${String(id)}' does not exist`)
  }

  return pipeline
}

const handOffState = (state: State) => {
  return { ...state, context: state.context, target: undefined, flip: false }
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
  return runPipeline(value, pipeline, handOffState(state))
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
  return await runPipelineAsync(value, pipeline, handOffState(state))
}
