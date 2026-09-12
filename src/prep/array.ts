import preparePipeline, { Options } from './index.js'
import type { ArrayStep } from '../run/array.js'
import type { ArrayOperation } from '../typesNext.js'

export default function prepareArrayStep(
  { $array: pipelines, $flip: flip }: ArrayOperation,
  options: Options,
): ArrayStep | undefined {
  if (pipelines === undefined) {
    return undefined // `undefined` is the same as not setting `$array` at all
  }

  if (!Array.isArray(pipelines)) {
    throw new Error(
      'Array operation was given a value that is not an array of pipelines',
    )
  }

  return {
    type: 'array',
    pipelines: pipelines.map((pipeline) => preparePipeline(pipeline, options)),
    ...(flip === true ? { flip } : {}),
  }
}
