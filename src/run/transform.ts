import { isThenable } from '../utils/is.js'
import type State from '../state.js'
import type { OperationStepBase } from './index.js'
import type {
  DataMapperWithState,
  AsyncDataMapperWithState,
} from '../typesNext.js'

export interface TransformStep extends OperationStepBase {
  type: 'transform'
  fn: DataMapperWithState | AsyncDataMapperWithState
}

export default function runTransformStep(
  value: unknown,
  { fn }: TransformStep,
  state: State,
) {
  return fn(value, state)
}

/**
 * Run a transformer and return its value. Throws when the transformer returns
 * a promise, as there's no way to await it here -- without this, the promise
 * would be passed on as the value and end up in the transformed data.
 */
export function runTransformStepSync(
  value: unknown,
  { fn }: TransformStep,
  state: State,
) {
  const next = fn(value, state)
  if (isThenable(next)) {
    throw new Error(
      'A transformer returned a promise in a synchronous pipeline. Use mapTransformAsync() to run async transformers',
    )
  }
  return next
}
