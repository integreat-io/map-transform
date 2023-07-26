import type {
  Operation,
  DataMapperWithOptions,
  AsyncDataMapperWithOptions,
  DataMapperWithState,
  AsyncDataMapperWithState,
  State,
} from '../types.js'
import { getStateValue, setStateValue } from '../utils/stateHelpers.js'

// Filters an array with the provided filter function, or returns the single
// value if it passes the filter.
async function filterValue(
  value: unknown,
  filterFn: DataMapperWithState | AsyncDataMapperWithState,
  state: State
) {
  if (Array.isArray(value)) {
    const results = await Promise.all(value.map((val) => filterFn(val, state)))
    return value.filter((_v, index) => results[index]) // eslint-disable-line security/detect-object-injection
  } else {
    const result = await filterFn(value, state)
    return result ? value : undefined
  }
}

/**
 * Given a filter function, returns an operation that will filter arrays or
 * single values with that filter function.
 */
export default function filter(
  fn: DataMapperWithOptions | AsyncDataMapperWithOptions
): Operation {
  return (options) => (next) => {
    if (typeof fn !== 'function') {
      return async (state) => await next(state)
    }
    const fnWithOptions = fn(options)

    return async (state) => {
      const nextState = await next(state)
      return setStateValue(
        nextState,
        await filterValue(getStateValue(nextState), fnWithOptions, nextState)
      )
    }
  }
}
