import preparePipeline, {
  type Options,
  type TransformDefinition,
} from './index.js'
import prepareTransformStep from './transform.js'
import type { FilterStep } from '../run/filter.js'
import type { FilterOperationNext as FilterOperation } from '../types.js'

/**
 * When `idOrPipeline` is a string or symbol, we prepare a pipeline with a
 * transform operation. Otherwise we treat `idOrPipeline` as a pipeline.
 */
function createPipeline(
  idOrPipeline: string | symbol | TransformDefinition,
  props: Record<string, unknown>,
  options: Options,
) {
  if (!idOrPipeline) {
    throw new Error('Filter operation is missing transformer id or pipeline')
  } else if (
    typeof idOrPipeline === 'string' ||
    typeof idOrPipeline === 'symbol'
  ) {
    const op = prepareTransformStep(
      { $transform: idOrPipeline, ...props },
      options,
      'Filter',
    )
    return [op]
  } else {
    return preparePipeline(idOrPipeline, options)
  }
}

/**
 * Prepare the `$filter` operation. When running the filter, there will be a
 * pipeline that we'll run against every value in an array, and we prepare that
 * pipeline here. There are two variants of this operation:
 *
 * 1. The "tradional" variant is specified just like the `$transform` operation,
 * with the id of a transformer and the rest of the props being props for the
 * transformer. In this case this pipeline will just have a transform operation.
 *
 * 2. In the "new" variant, the operation is just given a pipeline. We will just
 * prepare this pipeline.
 */
export default function prepareFilterStep(
  { $filter: idOrPipeline, ...props }: FilterOperation,
  options: Options,
): FilterStep {
  const pipeline = createPipeline(idOrPipeline, props, options)
  return {
    type: 'filter',
    pipeline,
  }
}
