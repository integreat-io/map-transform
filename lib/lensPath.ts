import * as R from 'ramda'

export const empty = R.lens(R.identity, R.identity)

// String -> String | Number
const parseIntIf = (val: string) => {
  const num = Number.parseInt(val)
  return (Number.isNaN(num)) ? val : num
}

// String -> (String | Number)[]
const preparePath = (path: string): (string | number)[] =>
  path.split(/\[|]?\./).map((val: string) => parseIntIf(val))

/**
 * Take a path string and return a Ramda lens. If path is null or undefined, an
 * empty lens (that always returns the value given to it) is returned.
 *
 * Example paths:
 * - `'content.heading'`
 * - `'data.items[0].id'`
 *
 * @param {string} path - A path string in dot notation
 * @returns {Lens} A Ramda lens
 */
export default (path?: string) => (path) ? R.lensPath(preparePath(path)) : empty
