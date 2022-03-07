import { Operation, State, Path } from '../types'
import getter from '../utils/pathGetter'
import setter, { Setter } from '../utils/pathSetter'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import root from './root'
import plug from './plug'
import { divide } from './directionals'

const isGet = (isGetOperation: boolean, isRev = false) =>
  isGetOperation ? !isRev : isRev

const setWithOnlyMapped =
  (state: State, setFn: Setter): Setter =>
  (value) =>
    state.onlyMapped && value === undefined
      ? state.target
      : setFn(value, state.target)

const getValueFromState = (path: Path) => (state: State) =>
  getter(path)(getStateValue(state))

const setValueFromState = (path: Path) => (state: State) => {
  const setFn = setWithOnlyMapped(state, setter(path))
  return setFn(getStateValue(state), undefined)
}

const getOrSet =
  (isGetOperation: boolean) =>
  (path: Path): Operation => {
    if (path && path.startsWith('^')) {
      const rootGetSet = root(getOrSet(isGetOperation)(path.slice(1)))
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
