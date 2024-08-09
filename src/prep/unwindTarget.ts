import { isObject } from '../utils/is.js'
import type { PreppedPipeline } from './index.js'

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
) {
  if (Array.isArray(target)) {
    // If the target is an array, return only the array in the targets array
    return [target]
  } else if (!isObject(target)) {
    // If target is not an object, return an empty targets array
    return []
  }

  // Pick out all the set steps, remove the prefix, and reverse
  const setPipeline = pipeline
    .filter((step) => step[0] === '>')
    .map((step) => step.slice(1))
    .reverse()

  // If we have no set steps, return an empty targets array
  if (setPipeline.length === 0) {
    return []
  }

  // Go through all the set steps and extract the target at each level
  const targets = []
  targets.push(target)
  for (const step of setPipeline.slice(0, -1)) {
    if (step === '[]') {
      break
    }
    target = target[step] // eslint-disable-line security/detect-object-injection
    if (isObject(target)) {
      // For an object, push and continue
      targets.push(target)
    } else if (Array.isArray(target)) {
      // For an array, push and stop
      targets.push(target)
      break
    } else {
      // For all other values, just stop
      break
    }
  }

  // Return the array of targets from the outermost to the innermost
  return targets
}
