import type { TransformStep } from '../run/transform.js'
import type { TransformOperation, Options } from '../types.js'
import type { Options as OptionsNext } from './index.js'

export function prepareFn(
  id: string | symbol | null,
  props: Record<string, unknown>,
  options: OptionsNext,
  opName: string,
) {
  if (!id) {
    throw new Error(`${opName} operation is missing transformer id`)
  }
  if (!options.transformers) {
    throw new Error(
      `Transformer '${String(id)}' was not found for ${opName.toLowerCase()} operation. No transformers`,
    )
  }

  const fn = options.transformers[id] // eslint-disable-line security/detect-object-injection
  if (typeof fn !== 'function') {
    throw new Error(
      `Transformer '${String(id)}' was not found for ${opName.toLowerCase()} operation`,
    )
  }

  return fn(props)(options as Options)
}

export default function prepareTransformStep(
  { $transform: id, ...props }: TransformOperation,
  options: OptionsNext,
): TransformStep {
  const fn = prepareFn(id, props, options, 'Transform')
  return { type: 'transform', fn }
}
