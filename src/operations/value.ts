import { Data, Operation, ValueFunction } from '../types'
import { extractValue } from '../functions/value'

export default function value(val: Data | ValueFunction): Operation {
  return () => (state) => ({
    ...state,
    value: state.onlyMapped ? undefined : extractValue(val),
  })
}
