import { isObject } from '../utils/is.js'
import type { PreppedPipeline, PreppedStep } from './index.js'

const isSetStep =
  (isRev: boolean) =>
  (step: PreppedStep): step is string =>
    typeof step === 'string' && (step[0] === '>' ? !isRev : isRev)

const removeStepPrefix = (path: string) =>
  path[0] === '>' ? path.slice(1) : path

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
  const setPipeline = pipeline.filter(isSetStep(isRev)).reverse()

  // If we have no set steps, return an empty targets array
  if (setPipeline.length === 0) {
    return []
  }

  // Go through all the set steps and extract the target at each level
  const targets = []
  for (let index = 0; index < setPipeline.length; index++) {
    const step = setPipeline[index] // eslint-disable-line security/detect-object-injection
    if (step === '[]' || step === '>[]') {
      break
    }

    if (isObject(target)) {
      // Push this target before getting the next
      targets.push(target)
      if (index < setPipeline.length - 1) {
        // We have not reached the last step yet -- fetch the next one
        target = target[removeStepPrefix(step)]
      }
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
