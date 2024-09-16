import type State from '../state.js'
import type { OperationStepBase } from './index.js'

export interface ValueStep extends OperationStepBase {
  type: 'value'
  value: unknown
  fixed?: boolean
}

export default function runValueStep(
  _value: unknown,
  { value, fixed }: ValueStep,
  state: State,
) {
  if (state.noDefaults && !fixed) {
    return undefined
  } else {
    return typeof value === 'function' ? value() : value
  }
}

// TODO: Should we also support fixed here? It could e.g. be a boolean property
