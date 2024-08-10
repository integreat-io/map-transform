import unwindTarget from './unwindTarget.js'
import { isObject } from '../utils/is.js'
import type { PreppedPipeline } from './index.js'

// Get from a prop
const getProp = (prop: string, value: unknown) =>
  isObject(value) ? value[prop] : undefined // eslint-disable-line security/detect-object-injection

// Set on a prop
function setProp(prop: string, value: unknown, target?: unknown) {
  if (target === undefined) {
    return { [prop]: value }
  } else if (isObject(target)) {
    target[prop] = value // eslint-disable-line security/detect-object-injection
    return target
  } else {
    return undefined
  }
}

// Get from an array index
function getIndex(prop: string, value: unknown) {
  if (Array.isArray(value)) {
    // We have an index and an array -- return the item at the index
    const index = Number.parseInt(prop, 10)
    // eslint-disable-next-line security/detect-object-injection
    return index < 0 ? value[value.length + index] : value[index]
  } else {
    // We have an index, but not an array -- return `undefined`
    return undefined
  }
}

// Set on an array index
function setIndex(prop: string, value: unknown, target?: unknown) {
  const index = Number.parseInt(prop, 10)
  const arr = Array.isArray(target) ? target : []
  // Set on the given index. If the index is negative, we always set
  // index 0 for now
  arr[index < 0 ? 0 : index] = value
  return arr
}

// Handle a single set step
function setStep(step: string, next: unknown, target: unknown) {
  if (step[0] === '[') {
    // Set on an index
    return setIndex(step.slice(1), next, target)
  } else {
    // Set on a prop
    return setProp(step, next, target)
  }
}

// Get the index of the next set array step, or get array step if
// we're in reverse.
const getNextSetArrayIndex = (
  pipeline: PreppedPipeline,
  currentIndex: number,
  isRev: boolean,
) => pipeline.indexOf(isRev ? '[]' : '>[]', currentIndex)

// Get the next set operation that is qualified for setting an array.
// If none exist, return the length of the `steps` array. When we're
// going in reverse, we do thes same, but will be looking for a get
// step instead.
function getNextSetArrayOrSetIndex(
  pipeline: PreppedPipeline,
  currentIndex: number,
  isRev: boolean,
) {
  let index = getNextSetArrayIndex(pipeline, currentIndex, isRev)
  if (index < 0) {
    // If there is no set array step, we treat the next set step as
    // an array set, or a get step if we're in reverse.
    index = pipeline.findIndex(
      (step) => (step[0] === '>' ? !isRev : isRev), // This is an xor with `isRev`
      currentIndex,
    )
  }
  return index < 0 ? pipeline.length : index
}

function itereatePartOfPipeline(
  fromIndex: number,
  toIndex: number,
  value: unknown[],
  pipeline: PreppedPipeline,
  target: unknown,
  isRev: boolean,
  context: unknown[],
) {
  // Hand off to the next level for each of the items in the array
  return value.flatMap((item) =>
    runOneLevel(item, pipeline.slice(fromIndex, toIndex), target, isRev, [
      ...context,
    ]),
  )
}

const extractStep = (step: string): [string, boolean] =>
  step[0] === '>' ? [step.slice(1), true] : [step, false]

// Run one the pipeline until a point where it needs to hand off to
// another level (currently because of iteration). Will finish any
// remainder of the pipeline when the lower levels are done.
function runOneLevel(
  value: unknown,
  pipeline: PreppedPipeline,
  target: unknown,
  isRev: boolean,
  context: unknown[],
) {
  let next = value
  let index = 0
  const targets = unwindTarget(target, pipeline, isRev)

  // We go through each step in the pipeline one by one until we're done
  while (index < pipeline.length) {
    const [step, isSet] = extractStep(pipeline[index++])

    if (step === '[]') {
      // Ensure that the value is an array -- regardless of direction
      next = Array.isArray(next) ? next : [next]
    } else if (isRev ? !isSet : isSet) {
      // This is a set step -- or a get step in reverse
      // TODO: Refactor to reuse get iteration code
      if (Array.isArray(next)) {
        const setArrayIndex = getNextSetArrayIndex(pipeline, index, isRev)
        if (setArrayIndex >= 0) {
          // Hand off to the next level for each of the items in the array
          next = itereatePartOfPipeline(
            index - 1, // Start the iteration from this step ...
            setArrayIndex,
            next,
            pipeline,
            target,
            isRev,
            [...context],
          )
          index = setArrayIndex // ... and continue until a qualified set operation
          continue
        }
      }

      next = setStep(step, next, targets.pop())
    } else if (step === '^^') {
      // Get the root from the context -- or the present
      // value when we have no context
      next = context.length === 0 ? next : context[0]
      context = []
    } else {
      // Check for functional indication in first char
      switch (step[0]) {
        case '^':
          // Get the parent value
          next = context.pop()
          break
        case '[':
          // Get the index position from an array
          next = getIndex(step.slice(1), next)
          break
        default:
          // We have a get prop
          context.push(next)
          // TODO: Refactor to reuse set iteration code
          if (Array.isArray(next)) {
            // The value is an array, so iterate over it
            const setArrayIndex = getNextSetArrayOrSetIndex(
              pipeline,
              index,
              isRev,
            )
            // Hand off to the next level for each of the items in the array
            next = itereatePartOfPipeline(
              index - 1, // Start the iteration from this step ...
              setArrayIndex,
              next,
              pipeline,
              target,
              isRev,
              [...context],
            )
            index = setArrayIndex // ... and continue until a qualified set operation
          } else {
            // Get from the given prop
            next = getProp(step, next)
          }
      }
    }
  }

  return next
}

/**
 * Applies the given pipeline on a value, and returns the resulting value.
 * If a `target` is given, any set steps will be attempted on the target, to
 * modify it with the corresponding values from the pipeline.
 */
export default function runPipeline(
  value: unknown,
  pipeline: PreppedPipeline,
  target?: unknown,
  isRev = false,
) {
  return runOneLevel(
    value,
    isRev ? [...pipeline].reverse() : pipeline, // Reverse the steps when we're going in reverse
    target,
    isRev,
    [],
  )
}
