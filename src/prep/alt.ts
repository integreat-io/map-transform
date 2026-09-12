import preparePipeline, { Options } from './index.js'
import type { AltStep } from '../run/alt.js'
import type { AltOperation } from '../typesNext.js'

export default function prepareAltStep(
  { $alt: pipelines }: AltOperation,
  options: Options,
): AltStep | undefined {
  if (!Array.isArray(pipelines)) {
    throw new Error(
      'Alt operation was given a value that is not an array of pipelines',
    )
  }

  if (pipelines.length > 0) {
    return {
      type: 'alt',
      pipelines: pipelines.map((pipeline) =>
        preparePipeline(pipeline, options),
      ),
    }
  }

  return undefined
}
