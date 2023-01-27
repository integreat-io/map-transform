import { State, Operation, DataMapper } from '../types.js'
import { getStateValue, setStateValue } from '../utils/stateHelpers.js'
import { identity } from '../utils/functional.js'

const callTransformFn = (fn: DataMapper) => (state: State) =>
  setStateValue(state, fn(getStateValue(state), state))

export default function transform(
  fn: DataMapper,
  revFn?: DataMapper
): Operation {
  const fwdTransform = typeof fn === 'function' ? callTransformFn(fn) : identity
  const revTransform =
    typeof revFn === 'function' ? callTransformFn(revFn) : fwdTransform

  return (_options) => (next) => (state) => {
    const nextState = next(state)
    return state.rev ? revTransform(nextState) : fwdTransform(nextState)
  }
}
