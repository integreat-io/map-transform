import { Operation, ValueFunction } from '../types.js'
import { extractValue } from '../functions/value.js'
import { setStateValue } from '../utils/stateHelpers.js'

export default function fixed(val: unknown | ValueFunction): Operation {
  return () => (_next) => (state) =>
    setStateValue(state, extractValue(val), true)
}
