export const ensureArray = (value: unknown) =>
  Array.isArray(value) ? value : value === undefined ? [] : [value]

export const cloneAsArray = (value: unknown) => ensureArray(value).slice()
