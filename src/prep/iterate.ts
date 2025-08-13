import preparePipeline, { Options } from './index.js'
import type { IterateStep } from '../run/iterate.js'
import type { IterateOperationNext as IterateOperation } from '../types.js'

export default function prepareArrayStep(
  { $iterate: pipeline }: IterateOperation,
  options: Options,
): IterateStep | undefined {
  if (pipeline && (!Array.isArray(pipeline) || pipeline.length > 0)) {
    return {
      type: 'iterate',
      pipeline: preparePipeline(pipeline, options),
    }
  } else {
    return undefined
  }
}
