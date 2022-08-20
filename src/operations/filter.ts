import { Operation, DataMapper } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'

const filterValue = (value: unknown, filterFn: (data: unknown) => boolean) =>
  Array.isArray(value)
    ? value.filter(filterFn)
    : filterFn(value)
    ? value
    : undefined

export default function filter(fn: DataMapper): Operation {
  return (_options) => (next) => {
    if (typeof fn !== 'function') {
      return (state) => next(state)
    }

    return (state) => {
      const nextState = next(state)
      const filterFn = (data: unknown) => !!fn(data, nextState)
      return setStateValue(
        nextState,
        filterValue(getStateValue(nextState), filterFn)
      )
    }
  }
}
