import type { TransformStep } from '../run/transform.js'
import type { TransformOperation, Options } from '../types.js'
import type { Options as OptionsNext } from './index.js'

const getTransformerFn = (fnId: string | symbol, options: OptionsNext) =>
  options.transformers && options.transformers[fnId] // eslint-disable-line security/detect-object-injection

export default function prepareTransformStep(
  { $transform, ...props }: TransformOperation,
  options: OptionsNext,
): TransformStep {
  const fn = getTransformerFn($transform, options)
  if (typeof fn === 'function') {
    return { type: 'transform', fn: fn(props)(options as Options) }
  } else {
    throw new Error(
      'Transform operation was called without a valid transformer function',
    )
  }
}
