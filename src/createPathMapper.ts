import preparePathStep from './prep/path.js'
import { createTransformFunction, DataMapper } from './createDataMapper.js'
import { goForward } from './utils/stateHelpers.js'
import type { Path, State } from './types.js'

// Will turn the given path into a set path
const createSetPath = (path: Path) =>
  path[0] === '>' ? path : path[0] === '<' ? `>${path.slice(1)}` : `>${path}`

// Create a mapper that will always map in forward direction
function createForwardMapper(path: Path): DataMapper {
  const pipeline = preparePathStep(path)
  const mapper = createTransformFunction(pipeline)
  return (value: unknown, state: State) => mapper(value, goForward(state))
}

/**
 * Returns a data mapper that will _get_ with a path string, regardless of the
 * direction in the given state.
 */
export function pathGetter(path?: Path | null): DataMapper {
  path = path ?? '' // Treat null and undefined as an empty path
  if (typeof path !== 'string') {
    throw new Error('The path getter only accepts a path string')
  }
  return createForwardMapper(path)
}

/**
 * Returns a data mapper that will _set_ with a path string, regardless of the
 * direction in the given state.
 */
export function pathSetter(path?: Path | null): DataMapper {
  path = path ?? '' // Treat null and undefined as an empty path
  if (typeof path !== 'string') {
    throw new Error('The path setter only accepts a path string')
  }
  return createForwardMapper(createSetPath(path))
}

/**
 * Returns a data mapper from a path string. As it is a data mapper, it will
 * honour the direction set in the given state.
 */
export default function createPathMapper(path?: Path | null): DataMapper {
  path = path ?? '' // Treat null and undefined as an empty path
  if (typeof path !== 'string') {
    throw new Error('The path mapper only accepts a path string')
  }

  const pipeline = preparePathStep(path)
  return createTransformFunction(pipeline)
}
