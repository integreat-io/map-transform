import deepmerge from 'deepmerge'
import type { Operation, State, TransformDefinition } from '../types.js'
import {
  getStateValue,
  setStateValue,
  isNonvalueState,
} from '../utils/stateHelpers.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import { isObject } from '../utils/is.js'

export function mergeExisting<T, U>(
  target: T[],
  source: U[]
): U | (U | T | (U & T))[] {
  if (Array.isArray(target)) {
    const arr = source.slice()
    target.forEach((value, index) => {
      // eslint-disable-next-line security/detect-object-injection
      arr[index] = deepmerge<U, T>(source[index], value, {
        arrayMerge: mergeExisting,
      })
    })
    return arr
  }
  return target
}

function mergeStates(state: State, thisState: State) {
  const target = getStateValue(state)
  const source = getStateValue(thisState)

  const value = !isObject(source)
    ? target
    : !isObject(target)
      ? source
      : deepmerge(target, source, { arrayMerge: mergeExisting })

  return setStateValue(state, value)
}

export default function merge(...defs: TransformDefinition[]): Operation {
  return (options) => (next) => {
    if (defs.length === 0) {
      return (state) => setStateValue(next(state), undefined)
    }
    const pipelines = defs.map((def) => defToOperation(def)(options)(next))

    return function (state) {
      const nextState = next(state)
      return isNonvalueState(nextState, options.nonvalues)
        ? setStateValue(nextState, undefined)
        : pipelines.map((pipeline) => pipeline(nextState)).reduce(mergeStates)
    }
  }
}
