import type { TransformStep } from '../run/transform.js'
import type { TransformOperation, Options } from '../types.js'
import type { Options as OptionsNext } from './index.js'

export default function prepareTransformStep(
  { $transform: id, ...props }: TransformOperation,
  options: OptionsNext,
): TransformStep {
  if (!id) {
    throw new Error('Transformer operation is missing transformer id')
  }
  if (!options.transformers) {
    throw new Error(
      `Transformer '${String(id)}' was not found. No transformers`,
    )
  }

  const fn = options.transformers[id] // eslint-disable-line security/detect-object-injection
  if (typeof fn === 'function') {
    return { type: 'transform', fn: fn(props)(options as Options) }
  } else {
    throw new Error(`Transformer '${String(id)}' was not found`)
  }
}
