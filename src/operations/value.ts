import { Operation } from '../types.js'
import { extractValue } from '../transformers/value.js'
import { setStateValue } from '../utils/stateHelpers.js'

export default function value(val: unknown): Operation {
  return () => (_next) => (state) =>
    state.onlyMapped ? state : setStateValue(state, extractValue(val), true)
}
