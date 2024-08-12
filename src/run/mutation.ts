import runPipeline, { PreppedPipeline } from './index.js'

export interface MutationStep {
  type: 'mutation'
  pipelines: PreppedPipeline[]
}

export default function runMutationStep(
  value: unknown,
  { pipelines }: MutationStep,
) {
  return pipelines.reduce(
    (target, pipeline) =>
      runPipeline(value, pipeline, target) as Record<string, unknown>,
    {},
  )
}
