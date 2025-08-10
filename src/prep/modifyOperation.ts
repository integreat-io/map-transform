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

const createConcatTransform = ({ $concat, ...rest }: Record<string, unknown>) =>
  createTransformOperation('concat', $concat, rest)

const createConcatRevTransform = ({
  $concatRev,
  ...rest
}: Record<string, unknown>) =>
  createTransformOperation('concatRev', $concatRev, rest)

const createLookupTransform = ({
  $lookup,
  path,
  ...rest
}: Record<string, unknown>) => ({
  ...rest,
  $transform: 'lookup',
  arrayPath: $lookup,
  propPath: path,
})

const createLookdownTransform = ({
  $lookdown,
  path,
  ...rest
}: Record<string, unknown>) => ({
  ...rest,
  $transform: 'lookdown',
  arrayPath: $lookdown,
  propPath: path,
})

const createFixedValue = ({ $fixed, ...rest }: Record<string, unknown>) => ({
  $value: $fixed,
  ...rest,
  fixed: true,
})

export default function modifyOperation(
  operation: MutationObject | OperationObject,
  options: Options,
) {
  if (typeof options.modifyOperationObject === 'function') {
    operation = options.modifyOperationObject(operation)
  }

  if (Object.prototype.hasOwnProperty.call(operation, '$and')) {
    return createAndTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$or')) {
    return createOrTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$not')) {
    return createNotTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$merge')) {
    return createMergeTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$concat')) {
    return createConcatTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$concatRev')) {
    return createConcatRevTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$lookup')) {
    return createLookupTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$lookdown')) {
    return createLookdownTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$fixed')) {
    return createFixedValue(operation)
  } else {
    return operation
  }
}
