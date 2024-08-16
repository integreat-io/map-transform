import preparePipeline, { Options } from './index.js'
import type { AltStep } from '../run/alt.js'
import type { AltOperationNext as AltOperation } from '../types.js'

export default function prepareAltStep(
  { $alt: pipelines, useLastAsDefault }: AltOperation,
  options: Options,
): AltStep | undefined {
  if (pipelines.length > 0) {
    return {
      type: 'alt',
      ...(useLastAsDefault && { useLastAsDefault }),
      pipelines: pipelines.map((pipeline) =>
        preparePipeline(pipeline, options),
      ),
    }
  }

  return undefined
}
