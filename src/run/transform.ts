import type State from '../state.js'
import type { DataMapperWithState, AsyncDataMapperWithState } from '../types.js'

export interface TransformStep {
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
