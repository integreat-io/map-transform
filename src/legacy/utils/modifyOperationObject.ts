const createTransformWithPath = (
  $transform: string,
  path: unknown,
  operator?: string,
) => ({
  $transform,
  path,
  ...(operator && { operator }),
})

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
  ...createTransformWithPath('logical', $and, 'AND'),
})

const createOrTransform = ({ $or, ...rest }: Record<string, unknown>) => ({
  ...rest,
  ...createTransformWithPath('logical', $or, 'OR'),
})

const createNotTransform = ({ $not, ...rest }: Record<string, unknown>) => ({
  ...rest,
  ...createTransformWithPath('not', $not),
})

const createMergeTransform = ({
  $merge,
  ...rest
}: Record<string, unknown>) => ({
  ...rest,
  ...createTransformWithPath('merge', $merge),
})

export default function modifyOperationObject(
  rawOperation: Record<string, unknown>,
  modify?: (operation: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown> {
  const operation =
    typeof modify === 'function' ? modify(rawOperation) : rawOperation

  if (Object.prototype.hasOwnProperty.call(operation, '$value')) {
    return createValueTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$and')) {
    return createAndTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$or')) {
    return createOrTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$not')) {
    return createNotTransform(operation)
  } else if (Object.prototype.hasOwnProperty.call(operation, '$merge')) {
    return createMergeTransform(operation)
  }

  return operation
}
