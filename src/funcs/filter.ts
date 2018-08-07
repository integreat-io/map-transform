import { compose, unless, always, ifElse, filter as filterR, identity } from 'ramda'
import { MapFunction, Data, State } from '../types'
import { getValue } from '../utils/stateHelpers'

export interface FilterFunction {
  (data: Data): boolean
}

export default function filter (fn: FilterFunction): MapFunction {
  if (typeof fn !== 'function') {
    return identity
  }

  const runFilter = compose(
    ifElse(
      Array.isArray,
      filterR(fn),
      unless(fn, always(undefined))
    ),
    getValue
  )

  return (state: State) => ({
    ...state,
    value: runFilter(state)
  })
}
