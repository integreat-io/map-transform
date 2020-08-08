import { Operation } from '../types'
import { extractValue } from '../functions/value'

export default function value(val: unknown): Operation {
  return () => (state) => ({
    ...state,
    value: state.onlyMapped ? undefined : extractValue(val),
  })
}
