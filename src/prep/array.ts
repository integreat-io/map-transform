import preparePipeline, { Options } from './index.js'
import type { ArrayStep } from '../run/array.js'
import type { ArrayOperation } from '../typesNext.js'

export default function prepareArrayStep(
  { $array: pipelines, $flip: flip }: ArrayOperation,
  options: Options,
): ArrayStep | undefined {
  return {
    type: 'array',
    pipelines: pipelines.map((pipeline) => preparePipeline(pipeline, options)),
    ...(flip === true ? { flip } : {}),
  }
}
