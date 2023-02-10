import { ensureArray } from '../utils/array.js'
import { Operands, DataMapper, Options } from '../types.js'
import { defsToDataMapper } from '../utils/definitionHelpers.js'
import { isObject } from '../utils/is.js'

interface MergeOperands extends Operands {
  path?: string | string[]
}

// Sort entries with value === undefined before other entries, to make sure that values are not overwritten by `undefined`
const undefinedFirst = (
  [_a, a]: [string, unknown],
  [_b, b]: [string, unknown]
) => (b === undefined && a !== undefined ? 1 : a === undefined ? -1 : 0)

// Merge objects, either from an array of paths that points to objects (or
// arrays of objects) or one path that points to an array of objects.
// Any values in the array (after flattening) that are not objects, will be
// skipped.
export default function merge(
  { path }: MergeOperands,
  _options: Options = {}
): DataMapper {
  const getFns = ensureArray(path).map(defsToDataMapper)

  return function mergePipelines(data, _state) {
    const values = getFns.flatMap((fn) => fn(data)).filter(isObject)
    return Object.fromEntries(
      values.flatMap(Object.entries).sort(undefinedFirst)
    )
  }
}
