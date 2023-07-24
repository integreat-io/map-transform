const createValueTransform = ({
  $value,
  ...rest
}: Record<string, unknown>) => ({
  ...rest,
  $transform: 'value',
  value: $value,
})

const createAndTransform = ({ $and, ...rest }: Record<string, unknown>) => ({
  ...rest,
  $transform: 'logical',
  path: $and,
  operator: 'AND',
})

const createOrTransform = ({ $or, ...rest }: Record<string, unknown>) => ({
  ...rest,
  $transform: 'logical',
  path: $or,
  operator: 'OR',
})

const createNotTransform = ({ $not, ...rest }: Record<string, unknown>) => ({
  ...rest,
  $transform: 'not',
  path: $not,
})

const createMergeTransform = ({
  $merge,
  ...rest
}: Record<string, unknown>) => ({
  ...rest,
  $transform: 'merge',
  path: $merge,
})

export default function modifyOperationObject(
  rawOperation: Record<string, unknown>,
  modify?: (operation: Record<string, unknown>) => Record<string, unknown>
): Record<string, unknown> {
  const operation =
    typeof modify === 'function' ? modify(rawOperation) : rawOperation

  if (operation.hasOwnProperty('$value')) {
    return createValueTransform(operation)
  } else if (operation.hasOwnProperty('$and')) {
    return createAndTransform(operation)
  } else if (operation.hasOwnProperty('$or')) {
    return createOrTransform(operation)
  } else if (operation.hasOwnProperty('$not')) {
    return createNotTransform(operation)
  } else if (operation.hasOwnProperty('$merge')) {
    return createMergeTransform(operation)
  }

  return operation
}
