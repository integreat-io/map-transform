import type { Transformer } from '../types.js'
import { unescapeValue } from '../utils/escape.js'
import { isObject } from '../utils/is.js'

export const extractValue = (value: unknown): unknown => {
  const val = isObject(value) ? value.value : value
  return unescapeValue(typeof val === 'function' ? val() : val)
}

const value: Transformer<unknown> = (props: unknown) => {
  const value = extractValue(props)
  return () => (_data, state) => state.noDefaults ? undefined : value
}

const fixed: Transformer<unknown> = (props: unknown) => {
  const value = extractValue(props)
  return () => () => value
}

export { value, fixed }
