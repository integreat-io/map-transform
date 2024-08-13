import runPipeline, { PreppedPipeline } from './index.js'
import type { State } from '../types.js'

export interface MutationStep {
  type: 'mutation'
  pipelines: PreppedPipeline[]
}

export default function runMutationStep(
  value: unknown,
  { pipelines }: MutationStep,
  state: State,
) {
  return pipelines.reduce(
    (target, pipeline) =>
      runPipeline(value, pipeline, { ...state, target }) as Record<
        string,
        unknown
      >,
    {},
  )
}
