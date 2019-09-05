import {
  compose,
  unless,
  always,
  ifElse,
  filter as filterR,
  identity
} from 'ramda'
import { Operation, DataMapper, Data, State, Options } from '../types'
import { getStateValue, contextFromState } from '../utils/stateHelpers'

export default function filter(fn: DataMapper): Operation {
  return (_options: Options) => {
    if (typeof fn !== 'function') {
      return identity
    }

    return (state: State) => {
      const run = (data: Data) => !!fn(data, contextFromState(state))

      const runFilter = compose(
        ifElse(Array.isArray, filterR(run), unless(run, always(undefined))),
        getStateValue
      )

      return {
        ...state,
        value: runFilter(state)
      }
    }
  }
}
