import { State, Options, Operation, DataMapperWithOptions } from '../types.js'
import { getStateValue, setStateValue } from '../utils/stateHelpers.js'
import { identity } from '../utils/functional.js'

function callTransformFn(fn: DataMapperWithOptions, options: Options) {
  const fnWithOptions = fn(options)
  return (state: State) =>
    setStateValue(state, fnWithOptions(getStateValue(state), state))
}

export default function transform(
  fn: DataMapperWithOptions,
  revFn?: DataMapperWithOptions
): Operation {
  return (options) => {
    const fwdTransform =
      typeof fn === 'function' ? callTransformFn(fn, options) : identity
    const revTransform =
      typeof revFn === 'function'
        ? callTransformFn(revFn, options)
        : fwdTransform

    return (next) => (state) => {
      const nextState = next(state)
      return state.rev ? revTransform(nextState) : fwdTransform(nextState)
    }
  }
}
