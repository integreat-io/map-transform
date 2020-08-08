import { Operation, ValueFunction } from '../types'
import { extractValue } from '../functions/value'

export default function fixed(val: unknown | ValueFunction): Operation {
  return () => (state) => ({
    ...state,
    value: extractValue(val),
  })
}
