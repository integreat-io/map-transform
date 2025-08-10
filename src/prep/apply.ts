import type { ApplyStep } from '../run/apply.js'
import type { ApplyOperation } from '../types.js'
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

  if (!options.neededPipelineIds) {
    options.neededPipelineIds = new Set()
  }
  options.neededPipelineIds.add(id)

  return { type: 'apply', id }
}
