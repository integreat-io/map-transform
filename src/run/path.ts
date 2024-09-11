import State from '../state.js'
import { isObject, isNonvalue } from '../utils/is.js'
import { runOneLevel, PreppedPipeline } from './index.js'
import xor from '../utils/xor.js'
import { ensureArray } from '../utils/array.js'

// Get from a prop
const getProp = (prop: string, value: unknown) =>
  isObject(value) ? value[prop] : undefined // eslint-disable-line security/detect-object-injection

// Set on a prop
function setProp(prop: string, value: unknown, target: unknown, state: State) {
  if (isNonvalue(value, state.nonvalues)) {
    value = undefined
  }
  if (state.noDefaults && value === undefined) {
    return target
  } else if (target === undefined) {
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

// Merge the value and the target if they are both objects. If not, return the
// value.
function merge(value: unknown, target: unknown) {
  if (isObject(value) && isObject(target)) {
    return { ...target, ...value }
  } else {
    return value
  }
}

// Return value as an array. Nonvalues become an empty array, unless
// `noDefaults` is `true`, in which case we return `undefined`.
function ensureArrayIfDefaultsAreAllowed(value: unknown, state: State) {
  if (state.noDefaults && isNonvalue(value, state.nonvalues)) {
    return undefined
  } else {
    return ensureArray(value, state.nonvalues)
  }
}

// Get the index of the next set array step, or get array step if
// we're in reverse.
const getNextSetArrayIndex = (pipeline: PreppedPipeline, isRev: boolean) =>
  pipeline.lastIndexOf(isRev ? '[]' : '>[]')

// Get the next set operation that is qualified for setting an array.
// If none exist, return the length of the `steps` array. When we're
// going in reverse, we do thes same, but will be looking for a get
// step instead.
function getNextSetArrayOrSetIndex(
  pipeline: PreppedPipeline,
  currentIndex: number,
  isRev: boolean,
) {
  let index = getNextSetArrayIndex(pipeline, isRev)
  if (index < currentIndex) {
    // If there is no set array step, we treat the next set step as
    // an array set, or a get step if we're in reverse.
    index = pipeline.findIndex(
      (step) =>
        typeof step === 'string' ? xor(step[0] === '>', isRev) : false, // Not a path step
      currentIndex,
    )
  }
  return index < currentIndex ? pipeline.length : index
}

// Extract the normalized path, and return true in the second position of
// of the tupple if this is a set path. If we are going forward, a '>' prefix
// indicates set, if we are in reverse, it indicates get.
const extractPathStep = (step: string, isRev: boolean): [string, boolean] =>
  step[0] === '>' ? [step.slice(1), !isRev] : [step, isRev]

// Return true if the given pipeline has one or more set steps. We take into
// account whether we are going forward or in reverse.
const hasSetSteps = (pipeline: PreppedPipeline, isRev: boolean) =>
  pipeline.some(
    (step) => typeof step === 'string' && xor(step.startsWith('>'), isRev),
  )

// Run the `pipline` on each item in the `value` array. The resulting array
// will be flattened. Will also iterate the `target`, to allow sets on the
// target items where appropriate. If the target is not an array, we force it
// to array with the target at index 0.
function iteratePartOfPipeline(
  value: unknown[],
  targets: unknown[],
  pipeline: PreppedPipeline,
  state: State,
  isRev: boolean,
) {
  const target = hasSetSteps(pipeline, isRev) ? targets.pop() : undefined

  const targetArr = ensureArray(target, state.nonvalues) // Make sure we have a target array
  return value.flatMap((item, index) =>
    runOneLevel(
      item,
      pipeline,
      new State({ ...state, target: targetArr[index] }, item), // eslint-disable-line security/detect-object-injection
    ),
  )
}

/**
 * Run a path step. The step will start with '>' when it's a set step.
 * When we're going in reverse, a get step will be treated as set, and
 * vica versa.
 */
export default function runPathStep(
  value: unknown,
  pipeline: PreppedPipeline,
  step: string,
  index: number,
  targets: unknown[],
  state: State,
  isRev: boolean, // We get the actual rev from the pipeline, to not derive it from state for each step
): [unknown, number] {
  // Normalize the path and set the `isSet` flag based on whether we are
  // in reverse or not.
  const [path, isSet] = extractPathStep(step, isRev)

  if (path === '[]') {
    // Ensure that the value is an array -- regardless of direction. We won't
    // turn nonvalues into empty arrays when `noDefaults` is `true`, though.
    return [ensureArrayIfDefaultsAreAllowed(value, state), index]
  } else if (path === '^') {
    // Get the parent value. This is never run in rev, as we remove it from the
    // pipeline before running it.
    return [state.context.pop(), index]
  } else if (path === '^^') {
    // Get the root from the context -- or the present value when we have no
    // context. When we're setting, treat this is a plug and return the target.
    if (isSet) {
      return [state.target, pipeline.length]
    } else {
      const next = state.context.length === 0 ? value : state.context[0]
      state.context = []
      return [next, index]
    }
  } else if (path === '.') {
    // Merge value and target, and prioritize value on conflicts
    return isSet ? [merge(value, targets.pop()), index] : [value, index]
  } else if (path === '...') {
    // Merge value and target, and prioritize target on conflicts. When we're
    // getting, threat as a plug and return target.
    return isSet
      ? [merge(targets.pop(), value), index]
      : [state.target, pipeline.length]
  } else if (path === '|') {
    // We have reached a plug step -- skip it if we are setting or return the
    // target and skip the rest of the pipeline if we are getting. What we are
    // really doing here, is skipping a set plug (also called reverse plug)
    // when we are moving forward and a get plug (also called forward plug)
    // when we are in reverse, but the `extractPathStep()` has normalized this
    // for us.
    return isSet ? [value, index] : [state.target, pipeline.length]
  }

  if (!isSet) {
    // Push value to context for get
    state.context.push(value)
  }

  if (path[0] === '[') {
    // This is an index path
    const stepIndex = path.slice(1)
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
      ? getNextSetArrayIndex(pipeline, isRev) // For set
      : getNextSetArrayOrSetIndex(pipeline, index, isRev) // For get
    // We always iterate when getting, and for pipelines with a set
    // array notation when setting.
    if (setArrayIndex >= index) {
      // Hand off to the next level for each of the items in the array
      // TODO: Should we push array to context?
      const next = iteratePartOfPipeline(
        value,
        targets,
        pipeline.slice(index - 1, setArrayIndex), // Iteration from this step to a qualified set operation
        state,
        isRev,
      )
      return [next, setArrayIndex] // Return index of the iteration left off, to continue from there
    }
  }

  // We are not iterating, so handle a get or set normally
  return [
    isSet
      ? setProp(path, value, targets.pop(), state) // Set to prop
      : getProp(path, value), // Get from prop
    index,
  ]
}
