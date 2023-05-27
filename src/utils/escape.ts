export const escapeValue = <T = unknown>(value: T | string) =>
  value === undefined ? '**undefined**' : value

export const unescapeValue = <T = unknown>(value: T | undefined) =>
  value === '**undefined**' ? undefined : value
