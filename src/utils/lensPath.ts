import * as R from 'ramda'
import pathGetter from './pathGetter'
import pathSetter from './pathSetter'

export type PathString = string

export const empty = R.lens(R.identity, R.identity)

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
export const lensPath = (path?: PathString | null): R.Lens =>
  (path) ? R.lens(pathGetter(path), pathSetter(path)) : empty
