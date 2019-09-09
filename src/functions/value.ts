import { Data, Operands, ValueFunction, Context } from '../types'

interface Options extends Operands {
  value?: Data | ValueFunction
}

const isOptions = (value: unknown): value is Options =>
  typeof value === 'object' && value !== null

export const extractValue = (value: Options | Data | ValueFunction) => {
  const val = isOptions(value) ? value.value : value
  return typeof val === 'function' ? val() : val
}

export function value(options: Options | Data | ValueFunction) {
  const value = extractValue(options)
  return (_data: Data, context?: Context) => {
    const { onlyMappedValues = false } = context || {}
    return onlyMappedValues ? undefined : value
  }
}

export function fixed(options: Options | string) {
  const value = extractValue(options)
  return (_data: Data, _context?: Context) => {
    return value
  }
}
