import { compose } from 'ramda'
import { Operation, State, Path } from '../types'
import getter from '../utils/pathGetter'
import setter, { SetFunction } from '../utils/pathSetter'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import root from './root'
import plug from './plug'
import { divide } from './directionals'

const isGet = (isGetOperation: boolean, isRev = false) =>
  isGetOperation ? !isRev : isRev

const setWithOnlyMapped = (state: State, setFn: SetFunction): SetFunction => (
  value
) => (state.onlyMapped && typeof value === 'undefined' ? value : setFn(value))

const getValueFromState = (path: Path) => compose(getter(path), getStateValue)

const setValueFromState = (path: Path) => (state: State) => {
  const setFn = setWithOnlyMapped(state, setter(path))
  return setFn(getStateValue(state))
}

const getOrSet = (isGetOperation: boolean) => (path: Path): Operation => {
  if (path && path.startsWith('^')) {
    const rootGetSet = root(getOrSet(isGetOperation)(path.substr(1)))
    return isGetOperation
      ? divide(rootGetSet, plug())
      : divide(plug(), rootGetSet)
  }

  const getFn = getValueFromState(path)
  const setFn = setValueFromState(path)

  return () => (state) =>
    setStateValue(
      state,
      isGet(isGetOperation, state.rev) ? getFn(state) : setFn(state)
    )
}

export const get = getOrSet(true)
export const set = getOrSet(false)
