import { Data, Operands, ValueFunction, DataMapper } from '../types'

interface Options extends Operands {
  value?: Data | ValueFunction
}

const isOptions = (value: unknown): value is Options =>
  typeof value === 'object' && value !== null

export const extractValue = (value: Options | Data | ValueFunction): Data => {
  const val = isOptions(value) ? value.value : value
  return typeof val === 'function' ? val() : val
}

export function value(options: Options | Data | ValueFunction): DataMapper {
  const value = extractValue(options)
  return (_data, context) => (context.onlyMappedValues ? undefined : value)
}

export function fixed(options: Options | string): DataMapper {
  const value = extractValue(options)
  return (_data, _context) => value
}
