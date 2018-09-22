import { identity } from 'ramda'
import { Data, State, MapFunction } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'

export interface TransformFunction {
  (data: Data, stateProps?: { rev: boolean, onlyMappedValues: boolean }): Data
}

const argFromState = ({ rev = false, onlyMapped = false }: State) => ({
  rev,
  onlyMappedValues: onlyMapped
})

const callTransformFn = (fn: TransformFunction) =>
  (state: State) => setStateValue(
    state,
    fn(getStateValue(state), argFromState(state))
  )

export default function transform (fn: TransformFunction, revFn?: TransformFunction): MapFunction {
  const fwdTransform = (typeof fn === 'function') ? callTransformFn(fn) : identity
  const revTransform = (typeof revFn === 'function') ? callTransformFn(revFn) : fwdTransform

  return (state) => (state.rev) ? revTransform(state) : fwdTransform(state)
}
