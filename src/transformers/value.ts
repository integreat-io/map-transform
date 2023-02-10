import { Operands, DataMapper } from '../types.js'
import { unescapeValue } from '../utils/escape.js'

interface Options extends Operands {
  value?: unknown
}

const isOptions = (value: unknown): value is Options =>
  typeof value === 'object' && value !== null

export const extractValue = (value: unknown): unknown => {
  const val = isOptions(value) ? value.value : value
  return unescapeValue(typeof val === 'function' ? val() : val)
}

export function value(operands: unknown): DataMapper {
  const value = extractValue(operands)
  return (_data, state) => (state.onlyMapped ? undefined : value)
}

export function fixed(operands: unknown): DataMapper {
  const value = extractValue(operands)
  return (_data, _state) => value
}
