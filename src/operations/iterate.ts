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
import { identity } from '../utils/functional.js'

export const iterateState =
  (fn: StateMapper) => (state: State, target: unknown) => {
    const value = getStateValue(state)
    if (Array.isArray(value)) {
      const nextState = pushContext(state, value)
      return value.map((item, index) =>
        getStateValue(
          fn(
            setTargetOnState(
              { ...nextState, index, value: item },
              indexOfIfArray(target, index)
            )
          )
        )
      )
    } else {
      return getStateValue(
        fn(
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
    return (_options) => (next) => (state) =>
      setStateValue(next(state), undefined)
  }
  return (options) => {
    const fn = defToOperation(def, options)
    const runIteration = iterateState(fn(options)(identity))
    return (next) =>
      function doIterate(state) {
        const nextState = next(state)

        return setStateValue(
          nextState,
          runIteration(nextState, getTargetFromState(nextState))
        )
      }
  }
}
