import prepareTransformStep from './transform.js'
import type { FilterStep } from '../run/filter.js'
import type { FilterOperation } from '../types.js'
import type { Options as OptionsNext } from './index.js'

/**
 * Prepare the `$filter` step.
 *
 * As we will basically just run a transform operation and filtering based on
 * the result for each item in an array, we're just setting a pipeline with a
 * transform operation here.
 */
export default function prepareFilterStep(
  { $filter: id, ...props }: FilterOperation,
  options: OptionsNext,
): FilterStep {
  const op = prepareTransformStep(
    { $transform: id, ...props },
    options,
    'Filter',
  )
  return {
    type: 'filter',
    pipeline: [op],
  }
}
