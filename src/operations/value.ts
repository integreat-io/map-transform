import { Operation } from '../types'
import { extractValue } from '../functions/value'
import { setStateValue } from '../utils/stateHelpers'

export default function value(val: unknown): Operation {
  return () => (_next) => (state) =>
    state.onlyMapped ? state : setStateValue(state, extractValue(val), true)
}
