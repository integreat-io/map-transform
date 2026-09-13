import runPipeline, { runPipelineAsync } from './index.js'
import type State from '../state.js'
import type { OperationStepBase, PreppedPipeline } from './index.js'

export interface IterateStep extends OperationStepBase {
  type: 'iterate'
  pipeline: PreppedPipeline
}

/**
 * Run the pipeline on a value. The step is prepared with `it: true`, so the
 * runner iterates arrays and hands each item to this function.
 */
export default function runIterateStep(
  value: unknown,
  { pipeline }: IterateStep,
  state: State,
) {
  return runPipeline(value, pipeline, state)
}

/**
 * Run the pipeline on a value. The step is prepared with `it: true`, so the
 * runner iterates arrays and hands each item to this function.
 *
 * This version supports async pipelines.
 */
export async function runIterateStepAsync(
  value: unknown,
  { pipeline }: IterateStep,
  state: State,
) {
  return await runPipelineAsync(value, pipeline, state)
}
