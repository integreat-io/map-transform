import type { DataMapperWithState, State } from '../types.js'

export interface TransformStep {
  type: 'transform'
  fn: DataMapperWithState
}

export default function runTransformStep(
  value: unknown,
  { fn }: TransformStep,
  state: State,
) {
  return fn(value, state)
}
