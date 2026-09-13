import { isPromise } from '../utils/is.js'
import type State from '../state.js'
import type { OperationStepBase } from './index.js'
import type {
  DataMapperWithState,
  AsyncDataMapperWithState,
} from '../typesNext.js'

export interface TransformStep extends OperationStepBase {
  type: 'transform'
  id: string | symbol
  fn: DataMapperWithState | AsyncDataMapperWithState
}

/**
 * Run the transformer function on the value.
 *
 * This version does not accept an async transformer, and will throw if the
 * transformer returns a promise.
 */
export default function runTransformStep(
  value: unknown,
  { id, fn }: TransformStep,
  state: State,
) {
  const ret = fn(value, state)
  if (isPromise(ret)) {
    throw new Error(
      `Transformer '${String(id)}' returned a promise. You cannot use async transformers when running MapTransform synchronously`,
    )
  }
  return ret
}

/**
 * Run the transformer function on the value.
 *
 * This version accepts an async transformer.
 */
export function runTransformStepAsync(
  value: unknown,
  { fn }: TransformStep,
  state: State,
) {
  return fn(value, state)
}
