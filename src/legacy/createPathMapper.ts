import {
  pathGetter as pathGetterNext,
  pathSetter as pathSetterNext,
} from '../createPathMapper.js'
import State from '../state.js'
import type { DataMapper } from '../createDataMapper.js'
import type { Path, DataMapperWithState } from './types.js'

// The obsolete root form is a single caret followed directly by a path,
// like `^page`. `^^.page`, `^.page` and a bare `^` are not obsolete.
const isObsoleteRootPath = (path: string) =>
  path[0] === '^' && path.length > 1 && path[1] !== '^' && path[1] !== '.'

const getPrefix = (path: string) =>
  path[0] === '>' || path[0] === '<' ? path[0] : ''

// Rewrite the obsolete root form `^path` to `^^.path`
export function normalizeRootPath(path?: Path | null) {
  if (typeof path !== 'string') {
    return path
  }
  const prefix = getPrefix(path)
  const rest = path.slice(prefix.length)
  return isObsoleteRootPath(rest) ? `${prefix}^^.${rest.slice(1)}` : path
}

const isParentOrRootPath = (path?: Path | null) =>
  typeof path === 'string' && path[getPrefix(path).length] === '^'

const returnTarget: DataMapper = (_value, state) => state.target

/**
 * Returns a data mapper that will _get_ with a path string, with the legacy
 * path syntax. Intended for the legacy transformers and operations, that will
 * hand it an internal state.
 */
export const createPathGetter = (path?: Path | null): DataMapper =>
  pathGetterNext(normalizeRootPath(path))

/**
 * Returns a data mapper that will _set_ with a path string, with the legacy
 * path syntax. As in the original legacy setter, a parent or root path sets
 * nothing and returns the target.
 */
export function createPathSetter(path?: Path | null): DataMapper {
  const normalized = normalizeRootPath(path)
  return isParentOrRootPath(normalized)
    ? returnTarget
    : pathSetterNext(normalized)
}

export function pathGetter(path?: Path | null): DataMapperWithState {
  const getter = createPathGetter(path)
  return (value, state) => {
    return getter(value, new State(state))
  }
}

export function pathSetter(path?: Path | null): DataMapperWithState {
  const setter = createPathSetter(path)
  return (value, state) => {
    return setter(value, new State(state))
  }
}
