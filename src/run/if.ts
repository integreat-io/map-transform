import runPipeline from './index.js'
import { goForward } from '../utils/stateHelpers.js'
import type State from '../state.js'
import type { OperationStepBase, PreppedPipeline } from './index.js'

export interface IfStep extends OperationStepBase {
  type: 'if'
  condition?: PreppedPipeline
  then: PreppedPipeline
  else: PreppedPipeline
}

// Run the `then` pipeline if `predicate` is `true`, otherwise run the `else`
// pipeline.
const runThenOrElse = (
  value: unknown,
  state: State,
  predicate: boolean,
  thenPipeline: PreppedPipeline,
  elsePipeline: PreppedPipeline,
) =>
  predicate
    ? runPipeline(value, thenPipeline, state)
    : runPipeline(value, elsePipeline, state)

/**
 * Run the condition pipeline with the value, and use the result to decide
 * whether to run the `then` or the `else` pipeline. If the result is truthy,
 * run the `then` pipeline with the value, or if it's faulty, run the `else`
 * pipeline. The result from the `then` or `else` pipeline will be returned.
 *
 * This version does not support async pipelines.
 */
export default function runIfStep(
  value: unknown,
  { condition, then: thenPipeline, else: elsePipeline }: IfStep,
  state: State,
) {
  const predicate = condition && runPipeline(value, condition, goForward(state))
  return runThenOrElse(value, state, !!predicate, thenPipeline, elsePipeline)
}

/**
 * Run the condition pipeline with the value, and use the result to decide
 * whether to run the `then` or the `else` pipeline. If the result is truthy,
 * run the `then` pipeline with the value, or if it's faulty, run the `else`
 * pipeline. The result from the `then` or `else` pipeline will be returned.
 *
 * This version supports async pipelines.
 */
export async function runIfStepAsync(
  value: unknown,
  { condition, then: thenPipeline, else: elsePipeline }: IfStep,
  state: State,
) {
  const predicate =
    condition && (await runPipeline(value, condition, goForward(state)))
  return runThenOrElse(value, state, !!predicate, thenPipeline, elsePipeline)
}
