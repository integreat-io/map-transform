import type { TransformStep } from '../run/transform.js'
import type { Options, TransformOperation } from '../types.js'

const getTransformerFn = (fnId: string | symbol, options: Options) =>
  options.transformers && options.transformers[fnId] // eslint-disable-line security/detect-object-injection

export default function prepareTransformStep(
  { $transform, ...props }: TransformOperation,
  options: Options,
): TransformStep {
  const fn = getTransformerFn($transform, options)
  if (typeof fn === 'function') {
    return { type: 'transform', fn: fn(props)(options) }
  } else {
    throw new Error(
      'Transform operation was called without a valid transformer function',
    )
  }
}
