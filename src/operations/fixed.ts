import { Operation, ValueFunction } from '../types'
import { extractValue } from '../functions/value'
import { setStateValue } from '../utils/stateHelpers'

export default function fixed(val: unknown | ValueFunction): Operation {
  return () => (_next) => (state) =>
    setStateValue(state, extractValue(val), true)
}
