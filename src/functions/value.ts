import { Data, Operands, Context } from '../types'

interface Options extends Operands {
  value?: Data
}

const extractValue = (value: Options | string) =>
  typeof value === 'string' ? value : value.value

export function value(options: Options | string) {
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
