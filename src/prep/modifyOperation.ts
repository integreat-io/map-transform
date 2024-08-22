import type { OperationObject, Options } from './index.js'
import type { MutationObject } from '../types.js'

const createTransformOperation = (
  $transform: string,
  path: unknown,
  rest: Record<string, unknown>,
  operator?: string,
) => ({
  ...rest,
  $transform,
  path,
  ...(operator && { operator }),
})

const createAndTransform = ({ $and, ...rest }: Record<string, unknown>) =>
  createTransformOperation('logical', $and, rest, 'AND')

const createOrTransform = ({ $or, ...rest }: Record<string, unknown>) =>
  createTransformOperation('logical', $or, rest, 'OR')

const createNotTransform = ({ $not, ...rest }: Record<string, unknown>) =>
  createTransformOperation('not', $not, rest)

const createMergeTransform = ({ $merge, ...rest }: Record<string, unknown>) =>
  createTransformOperation('merge', $merge, rest)

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
  } else if (operation.hasOwnProperty('$not')) {
    return createNotTransform(operation)
  } else if (operation.hasOwnProperty('$merge')) {
    return createMergeTransform(operation)
  } else {
    return operation
  }
}
