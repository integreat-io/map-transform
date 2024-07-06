import deepmerge from 'deepmerge'
import type {
  Operation,
  State,
  StateMapper,
  TransformDefinition,
} from '../types.js'
import {
  getStateValue,
  setStateValue,
  isNonvalueState,
} from '../utils/stateHelpers.js'
import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import { isObject } from '../utils/is.js'

export function mergeExisting<T, U>(
  target: T[],
  source: U[],
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

export function mergeStates(state: State, thisState: State) {
  const target = getStateValue(state)
  const source = getStateValue(thisState)

  const value = !isObject(source)
    ? target
    : !isObject(target)
      ? source
      : deepmerge(target, source, { arrayMerge: mergeExisting })

  return setStateValue(state, value)
}

const createMergeFn = (
  next: StateMapper,
  pipelines: StateMapper[],
  nonvalues?: unknown[],
) =>
  async function (state: State) {
    const nextState = await next(state)
    if (isNonvalueState(nextState, nonvalues)) {
      return setStateValue(nextState, undefined)
    } else {
      const states = []
      for (const pipeline of pipelines) {
        states.push(await pipeline(nextState))
      }
      return states.reduce(mergeStates)
    }
  }

const createSetEmptyFn =
  () => () => (next: StateMapper) => async (state: State) =>
    setStateValue(await next(state), undefined)

export default function merge(...defs: TransformDefinition[]): Operation {
  if (defs.length === 0) {
    return createSetEmptyFn()
  }
  return (options) => (next) => {
    const pipelines = defs.map((def) =>
      defToNextStateMapper(def, options)(next),
    )

    return createMergeFn(next, pipelines, options.nonvalues)
  }
}
