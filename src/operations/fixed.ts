import { Operation, ValueFunction } from '../types'
import { extractValue } from '../functions/value'

export default function fixed(val: unknown | ValueFunction): Operation {
  return () => (_next) => (state) => ({
    ...state,
    value: extractValue(val),
  })
}
