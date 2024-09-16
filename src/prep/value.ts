import type { ValueStep } from '../run/value.js'
import type { ValueOperation } from '../types.js'

const unescape = (value: unknown) =>
  value === '**undefined**' ? undefined : value

export default function prepareValueStep({
  $value: value,
  fixed = false,
}: ValueOperation): ValueStep {
  return {
    type: 'value',
    value: unescape(value),
    fixed,
  }
}
