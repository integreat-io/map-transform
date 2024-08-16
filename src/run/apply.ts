import runPipeline from './index.js'
import type State from '../state.js'

export interface ApplyStep {
  type: 'apply'
  id: string
}

export default function runApplyStep(
  value: unknown,
  { id }: ApplyStep,
  state: State,
) {
  const pipeline = state.pipelines.get(id)

  if (!pipeline) {
    throw new Error(`Pipeline '${id}' does not exist`)
  }

  return runPipeline(value, pipeline, {
    ...state,
    context: state.context,
    flip: false,
  })
}
