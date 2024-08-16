import preparePipeline, { TransformDefinition, Options } from './prep/index.js'
import runPipeline from './run/index.js'

export interface InitialState {
  context?: unknown[]
  target?: unknown
  rev?: boolean
  noDefaults?: boolean
}

export default function mapTransform(
  def: TransformDefinition,
  options: Options,
) {
  const pipeline = preparePipeline(def, options)
  const pipelines = new Map()
  if (options.neededPipelineIds && options.pipelines) {
    for (const id of options.neededPipelineIds) {
      const pipeline = options.pipelines[id] // eslint-disable-line security/detect-object-injection
      pipelines.set(id, preparePipeline(pipeline, options))
    }
  }

  const stateProps = { nonvalues: options.nonvalues, pipelines }

  return (value: unknown, state: InitialState) =>
    runPipeline(value, pipeline, { ...state, ...stateProps })
}
