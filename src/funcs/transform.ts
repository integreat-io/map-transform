import { compose, identity, converge } from 'ramda'
import { Data, MapFunction } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'

export interface TransformFunction {
  (data: Data): Data
}

export default function transform (fn: TransformFunction, revFn?: TransformFunction): MapFunction {
  const fwdTransform = (typeof fn === 'function')
    ? converge(setStateValue, [identity, compose(fn, getStateValue)])
    : identity

  const revTransform = (typeof revFn === 'function')
    ? converge(setStateValue, [identity, compose(revFn, getStateValue)])
    : fwdTransform

  return (state) => (state.rev) ? revTransform(state) : fwdTransform(state)
}
