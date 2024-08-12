import { isObject } from '../utils/is.js'
import type { PreppedPipeline } from '../prep/index.js'

/**
 * Extract the levels of a target object according to the set paths in the
 * pipeline. Will return an array of all the target levels, with the
 * outermost first. If we encounter an array, we will not continue, as the
 * each item in the array will be unwind at its own later. Any other value
 * will cause us to stop.
 */
export default function unwindTarget(
  target: unknown,
  pipeline: PreppedPipeline,
  isRev = false,
) {
  // When going forward: Pick out all the set steps, remove the prefix,
  // and reverse.
  // When in reverse: Pick out all the get steps.
  const setPipeline = isRev
    ? pipeline.filter((step) => step[0] !== '>').reverse()
    : pipeline
        .filter((step) => step[0] === '>')
        .map((step) => step.slice(1))
        .reverse()

  // If we have no set steps, return an empty targets array
  if (setPipeline.length === 0) {
    return []
  }

  // Go through all the set steps and extract the target at each level
  const targets = []
  for (const step of setPipeline) {
    if (step === '[]') {
      break
    }

    if (isObject(target)) {
      targets.push(target)
      // TODO: The target is never used on the last step, so find a way to not fetch it
      target = target[step] // eslint-disable-line security/detect-object-injection
    } else if (Array.isArray(target)) {
      // For an array, push and stop
      targets.push(target)
      break
    } else {
      // For all other values, set undefined
      targets.push(undefined)
      target = undefined
    }
  }

  // Return the array of targets from the outermost to the innermost
  return targets
}
