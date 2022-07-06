export const escapeValue = (value: unknown) =>
  value === undefined ? '**undefined**' : value

export const unescapeValue = (value: unknown) =>
  value === '**undefined**' ? undefined : value
