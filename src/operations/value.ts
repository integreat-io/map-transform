import { Operation } from '../types'
import { extractValue } from '../functions/value'

export default function value(val: unknown): Operation {
  return () => (_next) => (state) => ({
    ...state,
    value: state.onlyMapped ? undefined : extractValue(val),
  })
}
