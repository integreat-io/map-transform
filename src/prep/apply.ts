import type { ApplyStep } from '../run/apply.js'
import type { ApplyOperation } from '../types.js'
import type { Options } from './index.js'

export default function prepareApplyStep(
  { $apply: id }: ApplyOperation,
  options: Options,
): ApplyStep {
  if (typeof id !== 'string' || id === '') {
    throw new Error('Failed to apply pipeline. No id provided')
  }
  if (!options.pipelines) {
    throw new Error(`Failed to apply pipeline '${id}'. No pipelines`)
  }
  if (!options.pipelines.hasOwnProperty(id)) {
    throw new Error(`Failed to apply pipeline '${id}'`)
  }

  if (!options.neededPipelineIds) {
    options.neededPipelineIds = new Set()
  }
  options.neededPipelineIds.add(id)

  return { type: 'apply', id }
}