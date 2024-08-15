import type State from '../state.js'

export interface ValueStep {
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
