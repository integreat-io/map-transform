export const ensureArray = (value: unknown) =>
  Array.isArray(value)
    ? value
    : value === undefined || value === null
    ? []
    : [value]

export const cloneAsArray = (value: unknown) => ensureArray(value).slice()

export const indexOfIfArray = (arr: unknown, index?: number) =>
  Array.isArray(arr) && typeof index === 'number' ? arr[index] : arr // eslint-disable-line security/detect-object-injection
