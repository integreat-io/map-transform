/* eslint-disable @typescript-eslint/no-explicit-any */
import { Operands, DataMapper } from '../types'

interface Options extends Operands {
  value?: unknown
}

const isOptions = (value: unknown): value is Options =>
  typeof value === 'object' && value !== null

export const extractValue = (value: unknown): any => {
  const val = isOptions(value) ? value.value : value
  return typeof val === 'function' ? val() : val
}

export function value(operands: unknown): DataMapper {
  const value = extractValue(operands)
  return (_data, context) => (context.onlyMappedValues ? undefined : value)
}

export function fixed(operands: unknown): DataMapper {
  const value = extractValue(operands)
  return (_data, _context) => value
}
