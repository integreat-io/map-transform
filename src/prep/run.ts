import { isObject } from '../utils/is.js'
import type { PreppedPipeline } from './index.js'

// Get from a prop
const getProp = (prop: string, value: unknown) =>
  isObject(value) ? value[prop] : undefined // eslint-disable-line security/detect-object-injection

// Set on a prop
const setProp = (prop: string, value: unknown, target?: unknown) =>
  isObject(target) ? (target[prop] = value) : { [prop]: value } // eslint-disable-line security/detect-object-injection

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

// Handle set steps.
function setStep(step: string, next: unknown) {
  if (step[0] === '[') {
    // Set on an index
    return setIndex(step.slice(1), next)
  } else {
    // Set on a prop
    return setProp(step, next)
  }
}

// Get the next set operation that is qualified for setting an array.
// If none exist, return the length of the `steps` array
function getNextSetArrayIndex(steps: PreppedPipeline, currentIndex: number) {
  // Get the index of the next set array step
  let index = steps.indexOf('>[]', currentIndex)
  if (index < 0) {
    // If there is no set array step, we treat the next set step as an array set
    index = steps.findIndex((step) => step[0] === '>', currentIndex)
  }
  return index < 0 ? steps.length : index
}

export default function runPipeline(
  value: unknown,
  steps: PreppedPipeline,
  context: unknown[] = [],
) {
  let next = value
  let index = 0

  // We go through each step in the pipeline one by one until we're done
  while (index < steps.length) {
    const step = steps[index++]
    if (step === '[]' || step === '>[]') {
      // Ensure that the value is an array
      next = Array.isArray(next) ? next : [next]
    } else if (step === '^^') {
      // Get the root from the context -- or the present
      // value when we have no context
      next = context.length === 0 ? next : context[0]
      context = []
    } else {
      // Check for functional indication in first char
      switch (step[0]) {
        case '>':
          // Set on the given prop
          next = setStep(step.slice(1), next)
          break
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
          if (Array.isArray(next)) {
            // The value is an array, so iterate over it
            const iterateIndex = index - 1 // Start the iteration from this step
            index = getNextSetArrayIndex(steps, index) // And continue until a qualified set operation
            next = next.flatMap((item) =>
              runPipeline(item, steps.slice(iterateIndex, index), [...context]),
            )
          } else {
            // Get from the given prop
            next = getProp(step, next)
          }
      }
    }
  }

  return next
}
