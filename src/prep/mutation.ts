import prepPipeline, { Def } from './index.js'
import preparePathStep from './path.js'
import { isNotNullOrUndefined, isObject } from '../utils/is.js'
import type { MutationStep } from '../run/mutation.js'
import type { Options, MutationObject, Path } from '../types.js'

const slashedRegex = /\/\d+$/
const isSlashed = (path: Path) => slashedRegex.test(path)
const removeSlash = (path: Path) => path.replace(slashedRegex, '')

// Prepare one property by setting the key as the set path at the end of the
// pipeline. Properties starting with `'$'` or properties withtout pipelines
// are not included. Properties ending in `'[]'` with another mutation object
// as pipeline, is iterated.
function prepProp(setPath: string, pipeline: Def, options: Options) {
  if (setPath.startsWith('\\$')) {
    setPath = setPath.slice(1)
  } else if (setPath[0] === '$' || !pipeline) {
    return undefined
  }
  if (setPath.endsWith('[]') && isObject(pipeline)) {
    pipeline = { ...pipeline, $iterate: true }
  }
  if (isSlashed(setPath)) {
    setPath = removeSlash(setPath)
    pipeline = ['|', pipeline].flat()
  }
  return [...prepPipeline(pipeline, options), ...preparePathStep(`>${setPath}`)]
}

/**
 * Prepare a mutation step and return the internal step format. Each property
 * on the mutation object is made into a pipeline, with the prop as set path at
 * the end. `$modify` and `$flip` props are set on the step object as `mod` and
 * `flip`. `$modify` is prepared as a pipeline of only path segments, with
 * `true` becomming an empty pipeline.
 */
export default function prepareMutationStep(
  { $modify, $flip: flip = false, ...props }: MutationObject,
  options: Options,
): MutationStep | undefined {
  const pipelines = Object.entries(props)
    .map(([setPath, pipeline]) => prepProp(setPath, pipeline as Def, options))
    .filter(isNotNullOrUndefined)
  if (pipelines.length === 0 && $modify === true) {
    return undefined
  }

  const mod =
    $modify === true
      ? []
      : typeof $modify === 'string'
        ? preparePathStep($modify)
        : undefined

  return {
    type: 'mutation',
    ...(flip && { flip }),
    ...(mod && { mod }),
    pipelines,
  }
}
