import { Operation, DataMapper } from '../types'
import {
  getStateValue,
  setStateValue,
  contextFromState,
} from '../utils/stateHelpers'
import { identity } from '../utils/functional'

const filterValue = (value: unknown, filterFn: (data: unknown) => boolean) =>
  Array.isArray(value)
    ? value.filter(filterFn)
    : filterFn(value)
    ? value
    : undefined

export default function filter(fn: DataMapper): Operation {
  return (_options) => {
    if (typeof fn !== 'function') {
      return identity
    }

    return (state) => {
      const filterFn = (data: unknown) => !!fn(data, contextFromState(state))
      const value = getStateValue(state)
      return setStateValue(state, filterValue(value, filterFn))
    }
  }
}
