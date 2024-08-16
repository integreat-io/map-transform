import preparePipeline, { TransformDefinition } from './prep/index.js'
import runPipeline from './run/index.js'
import type { Options } from './types.js'

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
  const stateProps = { nonvalues: options.nonvalues }
  return (value: unknown, state: InitialState) =>
    runPipeline(value, pipeline, { ...state, ...stateProps })
}
