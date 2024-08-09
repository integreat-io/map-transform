import { isObject } from '../utils/is.js'
import type { Path } from '../types.js'

export type Step = Path
export type Pipeline = Step[]
export type Def = Step | Pipeline
export type DataMapper = (value: unknown) => unknown
export type Prepped = Path[]

const getProp = (prop: string, value: unknown) =>
  isObject(value) ? value[prop] : undefined // eslint-disable-line security/detect-object-injection
const setProp = (prop: string, value: unknown, target?: unknown) =>
  isObject(target) ? (target[prop] = value) : { [prop]: value } // eslint-disable-line security/detect-object-injection

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
function setIndex(prop: string, value: unknown, target?: unknown) {
  const index = Number.parseInt(prop, 10)
  const arr = Array.isArray(target) ? target : []
  // Set on the given index. If the index is negative, we always set
  // index 0 for now
  arr[index < 0 ? 0 : index] = value
  return arr
}

function splitPart(part: string): string[] {
  const indexOfBracket = part.indexOf('[')
  if (indexOfBracket >= 0) {
    const indexOfClosingBracket = part.indexOf(']', indexOfBracket)
    return [
      part.slice(0, indexOfBracket), // Any path before the bracket
      part.slice(indexOfBracket, indexOfClosingBracket + 1), // The array part
      ...splitPart(part.slice(indexOfClosingBracket + 1)), // Any path after the bracket -- usually more brackets
    ].filter(Boolean) // Remove any empty parts
  } else {
    return [part]
  }
}

const removeGetIndicator = (path: Path) =>
  path[0] === '<' ? path.slice(1) : path

function prepPath(path: Path) {
  if (path[0] === '>') {
    return path
      .slice(1)
      .split('.')
      .flatMap(splitPart)
      .map((part) => `>${part}`)
      .reverse()
  } else {
    return removeGetIndicator(path).split('.').flatMap(splitPart)
  }
}

function setStep(step: string, next: unknown) {
  if (step[0] === '[') {
    return setIndex(step.slice(1), next)
  } else {
    return setProp(step, next)
  }
}

function getNextSetArrayIndex(steps: Prepped, currentIndex: number) {
  let index = steps.indexOf('>[]', currentIndex)
  if (index < 0) {
    index = steps.findIndex((step) => step[0] === '>', currentIndex)
  }
  return index < 0 ? steps.length : index
}

function runPipeline(value: unknown, steps: Prepped, context: unknown[] = []) {
  let next = value
  let index = 0

  while (index < steps.length) {
    const step = steps[index++]
    if (step === '[]') {
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
          if (step === '>[]') {
            next = Array.isArray(next) ? next : [next]
          } else {
            // Set on the given prop
            next = setStep(step.slice(1), next)
          }
          break
        case '^':
          // Get the parent value
          next = context.pop()
          break
        case '[':
          next = getIndex(step.slice(1), next)
          break
        default:
          context.push(next)
          if (Array.isArray(next)) {
            // Ok, we have an array, so iterate over it
            const iterateIndex = index - 1
            index = getNextSetArrayIndex(steps, index)
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

const ensurePipeline = (def: Def): Pipeline =>
  Array.isArray(def) ? def : [def]

export default function prep(def: Def): DataMapper {
  const pipeline = ensurePipeline(def).flatMap(prepPath)

  // TODO: Rethink what to return here. Either return the
  // prepared pipeline or a function with no other context
  // than what it needs.
  return (value: unknown) => runPipeline(value, pipeline)
}
