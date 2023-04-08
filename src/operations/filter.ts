import type { Operation, DataMapperWithOptions } from '../types.js'
import { getStateValue, setStateValue } from '../utils/stateHelpers.js'

const filterValue = (value: unknown, filterFn: (data: unknown) => boolean) =>
  Array.isArray(value)
    ? value.filter(filterFn)
    : filterFn(value)
    ? value
    : undefined

export default function filter(fn: DataMapperWithOptions): Operation {
  return (options) => (next) => {
    if (typeof fn !== 'function') {
      return (state) => next(state)
    }
    const fnWithOptions = fn(options)

    return (state) => {
      const nextState = next(state)
      const filterFn = (data: unknown) => !!fnWithOptions(data, nextState)
      return setStateValue(
        nextState,
        filterValue(getStateValue(nextState), filterFn)
      )
    }
  }
}
