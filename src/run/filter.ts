import runPipeline, { runPipelineAsync } from './index.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import type StateNext from '../state.js'
import type { OperationStepBase, PreppedPipeline } from './index.js'
import type { State } from '../types.js'

export interface FilterStep extends OperationStepBase {
  type: 'filter'
  pipeline: PreppedPipeline
}

// Do the actual filtering and yield the results from the function, so that the
// caller may await the result when needed.
function* runFilterStepGen(
  value: unknown,
  pipeline: PreppedPipeline,
  state: State,
  isAsync = false,
): Generator<unknown, unknown, unknown> {
  if (Array.isArray(value)) {
    // We have an array. Run the function for every item and keep only the ones
    // where the function returns a truthy value.
    const items = []
    for (const item of value) {
      const result = yield isAsync
        ? runPipelineAsync(item, pipeline, state)
        : runPipeline(item, pipeline, state)
      if (result) {
        items.push(item)
      }
    }
    return items
  } else {
    // We have a single value. Run the function and return it if the function
    // returns a truthy value.
    const result = yield isAsync
      ? runPipelineAsync(value, pipeline, state)
      : runPipeline(value, pipeline, state)
    return result ? value : undefined
  }
}

/**
 * Run the pipeline for every value in an array and keep only the values where
 * the function returns truthy. If the value is a single value (not an array),
 * the value is returned when the pipeline returns truthy, otherwise `undefined`
 * is returned.
 *
 * This version does not accept an async pipeline.
 */
export default function runFilterStep(
  value: unknown,
  { pipeline }: FilterStep,
  state: StateNext,
) {
  const it = runFilterStepGen(value, pipeline, state)
  return runIterator(it)
}

/**
 * Run the pipeline for every value in an array and keep only the values where
 * the function returns truthy. If the value is a single value (not an array),
 * the value is returned when the pipeline returns truthy, otherwise `undefined`
 * is returned.
 *
 * This version accepts an async pipeline.
 */
export async function runFilterStepAsync(
  value: unknown,
  { pipeline }: FilterStep,
  state: StateNext,
) {
  const it = runFilterStepGen(value, pipeline, state, true)
  return runIteratorAsync(it)
}
