import type State from '../state.js'
import type { OperationStepBase } from './index.js'

export interface ValueStep extends OperationStepBase {
  type: 'value'
  value: unknown
}

export default function runValueStep(
  _value: unknown,
  { value }: ValueStep,
  state: State,
) {
  if (state.noDefaults) {
    return undefined
  } else {
    return typeof value === 'function' ? value() : value
  }
}

// TODO: Should we also support fixed here? It could e.g. be a boolean property
