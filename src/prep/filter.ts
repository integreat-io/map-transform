import { prepareFn } from './transform.js'
import type { FilterStep } from '../run/filter.js'
import type { FilterOperation } from '../types.js'
import type { Options as OptionsNext } from './index.js'

export default function prepareFilterStep(
  { $filter: id, ...props }: FilterOperation,
  options: OptionsNext,
): FilterStep {
  const fn = prepareFn(id, props, options, 'Filter')
  return {
    type: 'filter',
    fn,
  }
}
