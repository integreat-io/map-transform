import { State, Operation, DataMapper } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { identity } from '../utils/functional'

const callTransformFn = (fn: DataMapper) => (state: State) =>
  setStateValue(state, fn(getStateValue(state), state))

export default function transform(
  fn: DataMapper,
  revFn?: DataMapper
): Operation {
  const fwdTransform = typeof fn === 'function' ? callTransformFn(fn) : identity
  const revTransform =
    typeof revFn === 'function' ? callTransformFn(revFn) : fwdTransform

  return (_options) => (state) =>
    state.rev ? revTransform(state) : fwdTransform(state)
}
