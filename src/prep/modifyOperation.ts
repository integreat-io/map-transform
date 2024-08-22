import type { OperationObject, Options } from './index.js'
import type { MutationObject } from '../types.js'

const createTransformWithPath = (
  $transform: string,
  path: unknown,
  operator?: string,
) => ({
  $transform,
  path,
  ...(operator && { operator }),
})

const createAndTransform = ({ $and, ...rest }: Record<string, unknown>) => ({
  ...rest,
  ...createTransformWithPath('logical', $and, 'AND'),
})

const createOrTransform = ({ $or, ...rest }: Record<string, unknown>) => ({
  ...rest,
  ...createTransformWithPath('logical', $or, 'OR'),
})

const createMergeTransform = ({
  $merge,
  ...rest
}: Record<string, unknown>) => ({
  ...rest,
  ...createTransformWithPath('merge', $merge),
})

export default function modifyOperation(
  operation: MutationObject | OperationObject,
  options: Options,
) {
  if (typeof options.modifyOperationObject === 'function') {
    operation = options.modifyOperationObject(operation)
  }

  if (operation.hasOwnProperty('$and')) {
    return createAndTransform(operation)
  } else if (operation.hasOwnProperty('$or')) {
    return createOrTransform(operation)
  } else if (operation.hasOwnProperty('$merge')) {
    return createMergeTransform(operation)
  } else {
    return operation
  }
}
