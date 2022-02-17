export const identity = <T>(value: T) => value

// Source: https://medium.com/free-code-camp/10-ways-to-write-pipe-compose-in-javascript-f6d54c575616
// Typing only supports functions with the same signature ... :(

export const compose = <R>(...fns: ((a: R) => R)[]): ((a: R) => R) =>
  fns.reduceRight(
    (f, g) =>
      (...args) =>
        g(f(...args))
  )

export const pipe = <R>(...fns: ((a: R) => R)[]): ((a: R) => R) =>
  fns.reduce(
    (f, g) =>
      (...args) =>
        g(f(...args))
  )
