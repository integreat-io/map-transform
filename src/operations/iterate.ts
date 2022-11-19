import mapAny = require('map-any')
import { Operation, MapDefinition, State, StateMapper } from '../types'
import {
  getStateValue,
  setStateValue,
  getTargetFromState,
  setTargetOnState,
} from '../utils/stateHelpers'
import { operationFromDef } from '../utils/definitionHelpers'
import { indexOfIfArray } from '../utils/array'
import { identity } from '../utils/functional'

export const iterateState =
  (fn: StateMapper) => (state: State, target: unknown) =>
    mapAny(
      (value, index) =>
        getStateValue(
          fn(
            setTargetOnState(
              setStateValue({ ...state, index }, value, true),
              indexOfIfArray(target, index)
            )
          )
        ),
      getStateValue(state)
    )

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
          { ...nextState, context: state.context },
          runIteration(nextState, getTargetFromState(state))
        )
      }
  }
}
