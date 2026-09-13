import { extractPathStep } from './path.js'
import type { PreppedPipeline } from './index.js'

// Return `true` for set paths that add a level in the target, i.e. everything
// but the merge and plug steps.
const isLevelPath = (path: string) =>
  path !== '.' && path !== '...' && path !== '|'

/**
 * Resolve parent (`^`) and root (`^^`) set steps in a pipeline.
 *
 * A parent set step cancels the next set step in the pipeline, as the path it
 * came from went down and up again. Parent set steps that have nothing left to
 * cancel refer to the parent target levels of the pipelines enclosing this one,
 * and a root set step refers to the outermost level.
 *
 * Returns the pipeline without the resolved steps, and the index in the target
 * context of the level to set on. The level is `undefined` when we should set
 * on the current target, and `-1` when the pipeline refers to a level that
 * does not exist. `depth` is the number of levels in the target context.
 */
export default function resolveParentSets(
  pipeline: PreppedPipeline,
  isRev: boolean,
  depth: number,
): [PreppedPipeline, number | undefined] {
  let cancel = 0
  let toRoot = false
  const removed = new Set<number>()

  for (let index = 0; index < pipeline.length; index++) {
    const step = pipeline[index] // eslint-disable-line security/detect-object-injection
    if (typeof step !== 'string') {
      continue
    }
    const [path, isSet] = extractPathStep(step, isRev)
    if (!isSet) {
      continue
    }

    if (path === '^') {
      cancel++
      removed.add(index)
    } else if (path === '^^' || path === '^^^') {
      toRoot = true
      removed.add(index)
    } else if (toRoot) {
      removed.add(index)
    } else if (cancel > 0 && isLevelPath(path)) {
      cancel--
      removed.add(index)
    }
  }

  if (removed.size === 0) {
    return [pipeline, undefined]
  }

  const level = toRoot
    ? depth > 0
      ? 0
      : undefined
    : cancel > 0
      ? depth - cancel >= 0
        ? depth - cancel
        : -1
      : undefined
  return [pipeline.filter((_, index) => !removed.has(index)), level]
}
