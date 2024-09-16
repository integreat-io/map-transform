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

  if (operation.hasOwnProperty('$and')) {
    return createAndTransform(operation)
  } else if (operation.hasOwnProperty('$or')) {
    return createOrTransform(operation)
  } else if (operation.hasOwnProperty('$not')) {
    return createNotTransform(operation)
  } else if (operation.hasOwnProperty('$merge')) {
    return createMergeTransform(operation)
  } else if (operation.hasOwnProperty('$concat')) {
    return createConcatTransform(operation)
  } else if (operation.hasOwnProperty('$concatRev')) {
    return createConcatRevTransform(operation)
  } else if (operation.hasOwnProperty('$lookup')) {
    return createLookupTransform(operation)
  } else if (operation.hasOwnProperty('$lookdown')) {
    return createLookdownTransform(operation)
  } else if (operation.hasOwnProperty('$fixed')) {
    return createFixedValue(operation)
  } else {
    return operation
  }
}
