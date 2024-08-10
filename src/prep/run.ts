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

function handlePathStep(
  value: unknown,
  pipeline: PreppedPipeline,
  step: string,
  index: number,
  targets: unknown[],
  target: unknown,
  isRev: boolean,
  context: unknown[],
  isSet: boolean,
): [unknown, number] {
  if (!isSet) {
    // Push value to context for get
    context.push(value)
  }

  if (step[0] === '[') {
    // This is an index path
    const stepIndex = step.slice(1)
    return [
      isSet
        ? setIndex(stepIndex, value, targets.pop()) // Set to index
        : getIndex(stepIndex, value), // Get from index
      index,
    ]
  }

  if (Array.isArray(value)) {
    // We have an array -- consider if we should iterate
    const setArrayIndex = isSet
      ? getNextSetArrayIndex(pipeline, index, isRev) // For set
      : getNextSetArrayOrSetIndex(pipeline, index, isRev) // For get
    // We always iterate when getting, and for pipelines with a set
    // array notation when setting.
    if (setArrayIndex >= 0) {
      // Hand off to the next level for each of the items in the array
      const next = value.flatMap((item) =>
        runOneLevel(
          item,
          pipeline.slice(index - 1, setArrayIndex), // Iteration from this step to a qualified set operation
          target,
          isRev,
          [...context],
        ),
      )
      return [next, setArrayIndex] // Return index of the iteration left off, to continue from there
    }
  }

  // We are not iterating, so handle a get or set normally
  return [
    isSet
      ? setProp(step, value, targets.pop()) // Set to prop
      : getProp(step, value), // Get from prop
    index,
  ]
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
    } else if (step[0] === '^') {
      if (step === '^^') {
        // Get the root from the context -- or the present
        // value when we have no context
        next = context.length === 0 ? next : context[0]
        context = []
      } else {
        // Get the parent value
        next = context.pop()
      }
    } else {
      // This is a path step -- handle it for both get and set
      ;[next, index] = handlePathStep(
        next,
        pipeline,
        step,
        index,
        targets,
        target,
        isRev,
        context,
        isRev ? !isSet : isSet, // isSet
      )
    }
  }

  return next
}

function adjustPipelineToDirection(pipeline: PreppedPipeline, isRev: boolean) {
  // Reverse the steps when we're going in reverse
  const directedPipeline = isRev ? [...pipeline].reverse() : pipeline

  // Adjust pipeline for setting to parent or root
  const steps = []
  let skipCount = 0
  for (const step of directedPipeline) {
    if (isRev ? step === '^^' : step === '>^^') {
      // This is a root step -- skip the rest
      break
    } else if (isRev ? step === '^' : step === '>^') {
      // This is a parent step -- count how many to skip after this
      skipCount++
    } else if (skipCount > 0) {
      // This is path step and we're skipping
      skipCount--
    } else {
      // This is a path step -- keep it
      steps.push(step)
    }
  }

  return steps
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
    adjustPipelineToDirection(pipeline, isRev),
    target,
    isRev,
    [],
  )
}
