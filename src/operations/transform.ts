import type {
  Operation,
  DataMapperWithOptions,
  AsyncDataMapperWithOptions,
} from '../types.js'
import {
  getStateValue,
  setStateValue,
  revFromState,
} from '../utils/stateHelpers.js'

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
    const fwdPipeline = fn(options)
    const revPipeline =
      typeof revFn === 'function' ? revFn(options) : fwdPipeline

    return (next) => async (state) => {
      const nextState = await next(state)
      const fn = revFromState(nextState) ? revPipeline : fwdPipeline
      const value = await fn(getStateValue(nextState), nextState)
      return setStateValue(nextState, value)
    }
  }
}
