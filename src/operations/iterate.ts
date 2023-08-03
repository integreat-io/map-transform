import type {
  Operation,
  TransformDefinition,
  State,
  StateMapper,
} from '../types.js'
import {
  pushContext,
  getStateValue,
  setStateValue,
  getTargetFromState,
  setTargetOnState,
} from '../utils/stateHelpers.js'
import { defToOperation } from '../utils/definitionHelpers.js'
import { indexOfIfArray } from '../utils/array.js'
import { noopNext } from '../utils/stateHelpers.js'

export const iterateState =
  (fn: StateMapper) => async (state: State, target: unknown) => {
    const value = getStateValue(state)
    if (Array.isArray(value)) {
      const nextState = pushContext(state, value)
      return Promise.all(
        value.map(async (item, index) =>
          getStateValue(
            await fn(
              setTargetOnState(
                { ...nextState, index, value: item },
                indexOfIfArray(target, index)
              )
            )
          )
        )
      )
    } else {
      return getStateValue(
        await fn(
          setTargetOnState(
            { ...state, index: 0, value },
            indexOfIfArray(target, 0)
          )
        )
      )
    }
  }

export default function iterate(def: TransformDefinition): Operation {
  if (!def || (typeof def === 'object' && Object.keys(def).length === 0)) {
    return (_options) => (next) => async (state) =>
      setStateValue(await next(state), undefined)
  }
  return (options) => {
    const fn = defToOperation(def, options)(options)
    return (next) => {
      const runIteration = iterateState(fn(noopNext))
      return async function doIterate(state) {
        const nextState = await next(state)

        return setStateValue(
          nextState,
          await runIteration(nextState, getTargetFromState(nextState))
        )
      }
    }
  }
}
