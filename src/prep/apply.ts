import preparePipeline from './index.js'
import type { ApplyStep } from '../run/apply.js'
import type { PreppedPipeline } from '../run/index.js'
import type { ApplyOperation } from '../typesNext.js'
import type { Options } from './index.js'

export default function prepareApplyStep(
  { $apply: id }: ApplyOperation,
  options: Options,
): ApplyStep {
  if (!id) {
    throw new Error('Failed to apply pipeline. No id provided')
  }
  if (typeof id !== 'string' && typeof id !== 'symbol') {
    throw new Error('Failed to apply pipeline. Id is not string or symbol')
  }
  if (!options.pipelines) {
    throw new Error(`Failed to apply pipeline '${String(id)}'. No pipelines`)
  }
  if (!Object.prototype.hasOwnProperty.call(options.pipelines, id)) {
    throw new Error(
      `Failed to apply pipeline '${String(id)}'. Unknown pipeline`,
    )
  }
  const { preparedPipelines } = options
  if (!preparedPipelines) {
    throw new Error(
      `Failed to apply pipeline '${String(id)}'. Options have no prepared pipelines Map`,
    )
  }

  if (!preparedPipelines.has(id)) {
    // Set an empty pipeline first, so pipelines applying themselves terminate
    const pipeline: PreppedPipeline = []
    preparedPipelines.set(id, pipeline)
    try {
      pipeline.push(...preparePipeline(options.pipelines[id], options)) // eslint-disable-line security/detect-object-injection
    } catch (error) {
      preparedPipelines.delete(id)
      throw error
    }
  }

  return { type: 'apply', id }
}
