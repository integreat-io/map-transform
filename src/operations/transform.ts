import type {
  State,
  Options,
  Operation,
  DataMapperWithOptions,
  AsyncDataMapperWithOptions,
} from '../types.js'
import { getStateValue, setStateValue } from '../utils/stateHelpers.js'

function callTransformFn(
  fn: DataMapperWithOptions | AsyncDataMapperWithOptions,
  options: Options
) {
  const fnWithOptions = fn(options)
  return async (state: State) =>
    setStateValue(state, await fnWithOptions(getStateValue(state), state))
}

export default function transform(
  fn: DataMapperWithOptions | AsyncDataMapperWithOptions,
  revFn?: DataMapperWithOptions | AsyncDataMapperWithOptions
): Operation {
  return (options) => {
    if (typeof fn !== 'function') {
      throw new Error(
        'Transform operation was called without a valid transformer function'
      )
    }
    const fwdTransform = callTransformFn(fn, options)
    const revTransform =
      typeof revFn === 'function'
        ? callTransformFn(revFn, options)
        : fwdTransform

    return (next) => async (state) => {
      const nextState = await next(state)
      return state.rev
        ? await revTransform(nextState)
        : await fwdTransform(nextState)
    }
  }
}
