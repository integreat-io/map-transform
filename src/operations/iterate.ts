import { Operation, MapDefinition, State, StateMapper } from '../types'
import {
  pushContext,
  getStateValue,
  setStateValue,
  getTargetFromState,
  setTargetOnState,
} from '../utils/stateHelpers'
import { operationFromDef } from '../utils/definitionHelpers'
import { indexOfIfArray } from '../utils/array'
import { identity } from '../utils/functional'

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

export default function iterate(def: MapDefinition): Operation {
  if (!def || (typeof def === 'object' && Object.keys(def).length === 0)) {
    return (_options) => (next) => (state) =>
      setStateValue(next(state), undefined)
  }
  const fn = operationFromDef(def)

  return (options) => {
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
