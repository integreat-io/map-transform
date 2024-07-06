import {
  getStateValue,
  setStateValue,
  getTargetFromState,
  goForward,
} from '../utils/stateHelpers.js'
import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import { isObject } from '../utils/is.js'
import { noopNext } from '../utils/stateHelpers.js'
import type {
  Operation,
  StateMapper,
  State,
  TransformDefinition,
} from '../types.js'

async function modifyState(
  next: StateMapper,
  runFn: StateMapper,
  state: State,
) {
  const nextState = await next(state)
  const thisState = await runFn(goForward(nextState))
  const target = getTargetFromState(nextState)
  const value = getStateValue(thisState)
  const nextValue =
    isObject(target) && isObject(value)
      ? { ...value, ...target }
      : isObject(value)
        ? value
        : target
  return setStateValue(nextState, nextValue)
}

const createModifyFn =
  (next: StateMapper, runFn: StateMapper) => async (state: State) => {
    return modifyState(next, runFn, state)
  }

export default function modify(def: TransformDefinition): Operation {
  return (options) => {
    const runFn = defToNextStateMapper(def, options)(noopNext)
    return (next) => createModifyFn(next, runFn)
  }
}
