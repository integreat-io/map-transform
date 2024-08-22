import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import type StateNext from '../state.js'
import type { OperationStepBase } from './index.js'
import type {
  DataMapperWithState,
  AsyncDataMapperWithState,
  State,
} from '../types.js'

export interface FilterStep extends OperationStepBase {
  type: 'filter'
  fn: DataMapperWithState | AsyncDataMapperWithState
}

// Do the actual filtering and yield the results from the function, so that the
// caller may await the result when needed.
function* runFilterStepGen(
  value: unknown,
  fn: DataMapperWithState | AsyncDataMapperWithState,
  state: State,
): Generator<unknown, unknown, unknown> {
  if (Array.isArray(value)) {
    // We have an array. Run the function for every item and keep only the ones
    // where the function returns a truthy value.
    const items = []
    for (const item of value) {
      if (yield fn(item, state)) {
        items.push(item)
      }
    }
    return items
  } else {
    // We have a single value. Run the function and return it if the function
    // returns a truthy value.
    return (yield fn(value, state)) ? value : undefined
  }
}

/**
 * Run the transformer function for every value in an array and keep only the
 * values where the function returns truthy. If the value is a single value
 * (not an array), the value is returned when the function returns truthy,
 * otherwise `undefined` is returned.
 *
 * This version does not accept an async pipeline.
 */
export default function runFilterStep(
  value: unknown,
  { fn }: FilterStep,
  state: StateNext,
) {
  const it = runFilterStepGen(value, fn, state)
  return runIterator(it)
}

/**
 * Run the transformer function for every value in an array and keep only the
 * values where the function returns truthy. If the value is a single value
 * (not an array), the value is returned when the function returns truthy,
 * otherwise `undefined` is returned.
 *
 * This version accepts an async pipeline.
 */
export async function runFilterStepAsync(
  value: unknown,
  { fn }: FilterStep,
  state: StateNext,
) {
  const it = runFilterStepGen(value, fn, state)
  return runIteratorAsync(it)
}
