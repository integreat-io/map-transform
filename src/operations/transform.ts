import { identity } from 'ramda'
import { State, Operation, DataMapper, Options } from '../types'
import {
  getStateValue,
  setStateValue,
  contextFromState
} from '../utils/stateHelpers'

const callTransformFn = (fn: DataMapper) => (state: State) =>
  setStateValue(state, fn(getStateValue(state), contextFromState(state)))

export default function transform(
  fn: DataMapper,
  revFn?: DataMapper
): Operation {
  const fwdTransform = typeof fn === 'function' ? callTransformFn(fn) : identity
  const revTransform =
    typeof revFn === 'function' ? callTransformFn(revFn) : fwdTransform

  return (_options: Options) => state =>
    state.rev ? revTransform(state) : fwdTransform(state)
}
