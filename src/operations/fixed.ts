import { Data, Operation, ValueFunction } from '../types'
import { extractValue } from '../functions/value'

export default function fixed(val: Data | ValueFunction): Operation {
  return () => (state) => ({
    ...state,
    value: extractValue(val),
  })
}
