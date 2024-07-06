import { getStateValue, setStateValue } from '../utils/stateHelpers.js'
import type {
  Operation,
  DataMapperWithOptions,
  AsyncDataMapperWithOptions,
  DataMapperWithState,
  AsyncDataMapperWithState,
  State,
  NextStateMapper,
} from '../types.js'

// Filters an array with the provided filter function, or returns the single
// value if it passes the filter.
async function filterValue(
  values: unknown,
  filterFn: DataMapperWithState | AsyncDataMapperWithState,
  state: State,
) {
  if (Array.isArray(values)) {
    const results = []
    for (const value of values) {
      if (await filterFn(value, state)) {
        results.push(value)
      }
    }
    return results
  } else {
    const result = await filterFn(values, state)
    return result ? values : undefined
  }
}

export function filterNext(
  fn?: DataMapperWithState | AsyncDataMapperWithState,
): NextStateMapper {
  return (next) => {
    if (typeof fn !== 'function') {
      return async (state) => await next(state)
    }
    return async (state) => {
      const nextState = await next(state)
      return setStateValue(
        nextState,
        await filterValue(getStateValue(nextState), fn, nextState),
      )
    }
  }
}

/**
 * Given a filter function, returns an operation that will filter arrays or
 * single values with that filter function.
 */
export default function filter(
  fn: DataMapperWithOptions | AsyncDataMapperWithOptions,
): Operation {
  return (options) => {
    const fnWithOptions = typeof fn === 'function' ? fn(options) : undefined
    return filterNext(fnWithOptions)
  }
}
