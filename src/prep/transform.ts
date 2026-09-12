import type { TransformStep } from '../run/transform.js'
import type { TransformOperation } from '../typesNext.js'
import type { Options } from './index.js'

function prepareFn(
  id: string | symbol | null,
  props: Record<string, unknown>,
  options: Options,
  opName: string,
) {
  if (!id) {
    throw new Error(`${opName} operation is missing transformer id`)
  }

  if (typeof id === 'function') {
    throw new Error(
      `${opName} operation was given a transformer function. Register the transformer in options and give its id instead`,
    )
  }

  if (typeof id !== 'string' && typeof id !== 'symbol') {
    throw new Error(
      `${opName} operation was given a transformer id that is not a string or symbol`,
    )
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

  // We have a transformer function, so give it props and options
  return fn(props)(options as Options)
}

/**
 * Prepare the `$transform` operation.
 *
 * Note that the `opName` argument is used by the `$filter` operation, when it
 * runs it default operation through a transformer. The `opName` makes error
 * messages more meaningful.
 */
export default function prepareTransformStep(
  { $transform: id, ...props }: TransformOperation,
  options: Options,
  opName = 'Transform',
): TransformStep {
  const fn = prepareFn(id, props, options, opName)
  return { type: 'transform', fn }
}
