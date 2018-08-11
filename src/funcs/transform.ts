import { compose, identity } from 'ramda'
import { Data, MapFunction, State } from '../types'
import { getStateValue } from '../utils/stateHelpers'

export interface TransformFunction {
  (data: Data): Data
}

export default function transform (fn: TransformFunction): MapFunction {
  if (typeof fn !== 'function') {
    return identity
  }

  const runTransform = compose(fn, getStateValue)

  return (state: State) => ({
    ...state,
    value: runTransform(state)
  })
}
