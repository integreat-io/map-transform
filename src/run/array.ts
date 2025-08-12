import State, { type InitialState } from '../state.js'
import runPipeline, { runPipelineAsync } from './index.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import { revFromState } from '../utils/stateHelpers.js'
import { ensureArray } from '../utils/array.js'
import type { OperationStepBase, PreppedPipeline } from './index.js'

export interface ArrayStep extends OperationStepBase {
  type: 'array'
  pipelines: PreppedPipeline[]
  flip?: true
}

/**
 * Run each pipeline and return the values as an array.
 */
function* getValuesFromPipelines(
  value: unknown,
  pipelines: PreppedPipeline[],
  state: State,
  isAsync = false,
): Generator<unknown, unknown, unknown> {
  const values = []
  const nextState: InitialState = { ...state, rev: false } // To make sure we're always going forward here

  // Run each pipeline on the value to the `values` array
  for (const pipeline of pipelines) {
    const result = yield isAsync
      ? runPipelineAsync(value, pipeline, nextState)
      : runPipeline(value, pipeline, nextState)
    values.push(result)
  }

  // Return the array of values
  return values
}

/**
 * Run each pipeline on the value corresponding to its position in the
 * `pipelines` array, providing the result of each pipeline as the target of
 * the next.
 */
function* setValuesFromPipelines(
  values: unknown[],
  pipelines: PreppedPipeline[],
  state: State,
  isAsync = false,
): Generator<unknown, unknown, unknown> {
  let target: unknown = undefined

  // Run each pipeline
  for (const [index, pipeline] of pipelines.entries()) {
    // eslint-disable-next-line security/detect-object-injection
    const value = values[index]
    const nextState: InitialState = { ...state, target, rev: true } // Set previous return value as target and make sure we always move in reverse
    target = yield isAsync
      ? runPipelineAsync(value, pipeline, nextState)
      : runPipeline(value, pipeline, nextState)
  }

  // Return the array of values
  return target
}

/**
 * Run all piplines and return the value of each in an array. Each value is
 * returned in place, and `undefined` is kept.
 */
export default function runArrayStep(
  value: unknown,
  { pipelines, flip }: ArrayStep,
  state: State,
) {
  const isRev = revFromState(state, flip)

  if (pipelines.length === 0) {
    return isRev ? undefined : []
  }

  const it = isRev
    ? setValuesFromPipelines(ensureArray(value), pipelines, state)
    : getValuesFromPipelines(value, pipelines, state)
  return runIterator(it)
}

/**
 * Run all piplines and return the value of each in an array. Each value is
 * returned in place, and `undefined` is kept.
 *
 * This version supports async pipelines.
 */
export async function runArrayStepAsync(
  value: unknown,
  { pipelines, flip }: ArrayStep,
  state: State,
) {
  const isRev = revFromState(state, flip)

  if (pipelines.length === 0) {
    return isRev ? undefined : []
  }

  const it = isRev
    ? setValuesFromPipelines(ensureArray(value), pipelines, state, true)
    : getValuesFromPipelines(value, pipelines, state, true)
  return runIteratorAsync(it)
}
