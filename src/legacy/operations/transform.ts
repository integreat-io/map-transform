import type {
  Operation,
  DataMapperWithState,
  AsyncDataMapperWithState,
  DataMapperWithOptions,
  AsyncDataMapperWithOptions,
  NextStateMapper,
} from '../types.js'
import {
  getStateValue,
  setStateValue,
  revFromState,
} from '../utils/stateHelpers.js'

export function transformNext(
  fwdFn?: DataMapperWithState | AsyncDataMapperWithState,
  revFn?: DataMapperWithState | AsyncDataMapperWithState,
): NextStateMapper {
  if (typeof fwdFn !== 'function') {
    throw new Error(
      'Transform operation was called without a valid transformer function',
    )
  }
  if (typeof revFn !== 'function') {
    revFn = fwdFn
  }

  return (next) => async (state) => {
    const nextState = await next(state)
    const fn = revFromState(nextState) ? revFn : fwdFn
    const value = await fn(getStateValue(nextState), nextState)
    return setStateValue(nextState, value)
  }
}

export default function transform(
  fn: DataMapperWithOptions | AsyncDataMapperWithOptions,
  revFn?: DataMapperWithOptions | AsyncDataMapperWithOptions,
): Operation {
  return (options) => {
    const fwd = typeof fn === 'function' ? fn(options) : undefined
    const rev = typeof revFn === 'function' ? revFn(options) : undefined

    return transformNext(fwd, rev)
  }
}
