import { mergeStates } from './merge.js'
import {
  setStateValue,
  getStateValue,
  revFromState,
  flipState,
} from '../utils/stateHelpers.js'
import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'
import type {
  Operation,
  TransformDefinition,
  State,
  StateMapper,
} from '../types.js'

const merge = <T, U>(left: T[], right: U | U[]) =>
  Array.isArray(right) ? [...left, ...right] : [...left, right]

// Extract arrays from several pipelines and merge them into one array, then
// filter away `undefined`.
async function getAndMergeArrays(state: State, fns: StateMapper[]) {
  let nextValue: unknown[] = []
  for (const fn of fns) {
    const value = getStateValue(await fn(state))
    nextValue = merge(nextValue, value)
  }
  return setStateValue(
    state,
    nextValue.filter((val) => val !== undefined),
  )
}

// Set the first pipeline to the entire array, and the following pipelines to
// empty arrays.
async function setArrayOnFirstOperation(state: State, fns: StateMapper[]) {
  let valueState = await fns[0](state) // We know there is at least one function
  for (const fn of fns.slice(1)) {
    const thisState = await fn(setStateValue(state, []))
    valueState = mergeStates(valueState, thisState)
  }
  return valueState
}

function concatPipelines(
  defs: TransformDefinition[],
  flip: boolean,
): Operation {
  return (options) => {
    const fns = defs.map((def) => defToNextStateMapper(def, options)(noopNext))

    if (fns.length === 0) {
      // Always return an empty array (or empty object in rev) when there are no
      // pipelines.
      return (next) => async (state) =>
        setStateValue(await next(state), revFromState(state, flip) ? {} : [])
    }

    return (next) =>
      async function doConcat(state) {
        const nextState = flipState(await next(state), flip)
        return revFromState(nextState)
          ? setArrayOnFirstOperation(nextState, fns)
          : getAndMergeArrays(nextState, fns)
      }
  }
}

/**
 * Extracts arrays from several pipelines and merges them into one array. If
 * a pipeline does not return an array, it will be wrapped in one. `undefined`
 * will be stripped away.
 *
 * In reverse, the first pipeline will be given the entire array, and the
 * following pipelines will be given an empty array. This will not lead to the
 * original object, if we ran this forward and then in reverse, but there is no
 * way of knowing how to split up an array into the "original" arrays.
 */
export function concat(...defs: TransformDefinition[]): Operation {
  return concatPipelines(defs, false)
}

// `concatRev` is the exact oposite of `concat`, and will concat in reverse.
export function concatRev(...defs: TransformDefinition[]): Operation {
  return concatPipelines(defs, true)
}
