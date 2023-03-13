import { TransformerProps, DataMapper } from '../types.js'
import { unescapeValue } from '../utils/escape.js'

interface Options extends TransformerProps {
  value?: unknown
}

const isOptions = (value: unknown): value is Options =>
  typeof value === 'object' && value !== null

export const extractValue = (value: unknown): unknown => {
  const val = isOptions(value) ? value.value : value
  return unescapeValue(typeof val === 'function' ? val() : val)
}

export function value(props: unknown): DataMapper {
  const value = extractValue(props)
  return (_data, state) => (state.noDefaults ? undefined : value)
}

export function fixed(props: unknown): DataMapper {
  const value = extractValue(props)
  return (_data, _state) => value
}
