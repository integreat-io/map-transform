import runPipeline, { runPipelineAsync } from './index.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import type State from '../state.js'
import type { OperationStepBase, PreppedPipeline } from './index.js'

export interface IterateStep extends OperationStepBase {
  type: 'iterate'
  pipeline: PreppedPipeline
}

/**
 * Run each pipeline and return the values as an array.
 */
function* applyPipeline(
  data: unknown,
  pipeline: PreppedPipeline,
  state: State,
  isAsync = false,
): Generator<unknown, unknown, unknown> {
  if (Array.isArray(data)) {
    const values = []

    // Run each pipeline on the value to the `values` array
    for (const item of data) {
      const result = yield isAsync
        ? runPipelineAsync(item, pipeline, state)
        : runPipeline(item, pipeline, state)
      values.push(result)
    }

    // Return the array of values
    return values
  } else {
    return yield isAsync
      ? runPipelineAsync(data, pipeline, state)
      : runPipeline(data, pipeline, state)
  }
}

/**
 * Run the pipeline for every item in an array
 */
export default function runIterateStep(
  value: unknown,
  { pipeline }: IterateStep,
  state: State,
) {
  const it = applyPipeline(value, pipeline, state)
  return runIterator(it)
}

/**
 * Run the pipeline for every item in an array
 *
 * This version supports async pipelines.
 */
export async function runIterateStepAsync(
  value: unknown,
  { pipeline }: IterateStep,
  state: State,
) {
  const it = applyPipeline(value, pipeline, state, true)
  return runIteratorAsync(it)
}
