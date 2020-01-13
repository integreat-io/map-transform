import mergeDeep = require('lodash.merge')
import { Operation, State, MapDefinition, Options } from '../types'
import {
  getStateValue,
  setStateValue,
  shouldMutate
} from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const mergeStates = (state: State, thisState: State) =>
  setStateValue(
    state,
    mergeDeep(getStateValue(state), getStateValue(thisState))
  )

export default function merge(...defs: MapDefinition[]): Operation {
  return (options: Options) => {
    const shouldMutateCheck = shouldMutate(options)
    if (defs.length === 0) {
      return (state: State) => setStateValue(state, undefined)
    }
    const pipelines = defs.map(def => mapFunctionFromDef(def)(options))

    return (state: State): State =>
      shouldMutateCheck(state)
        ? setStateValue(state, undefined)
        : pipelines.map(pipeline => pipeline(state)).reduce(mergeStates)
  }
}
