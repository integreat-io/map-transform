import mapAny = require('map-any')
import { Operation, State, Path } from '../types'
import getter, { GetFunction } from '../utils/pathGetter'
import setter, { SetFunction } from '../utils/pathSetter'
import root from './root'
import plug from './plug'
import { divide } from './directionals'

const getValue = (get: GetFunction, isArray: boolean, state: State): State => {
  const value = get(state.value)
  const arr = isArray || (!Array.isArray(state.value) && Array.isArray(value))

  return { ...state, value: isArray && !value ? [] : value, arr }
}

const setValue = (set: SetFunction, isArray: boolean, state: State): State => {
  const setFn: SetFunction = value =>
    state.onlyMapped && value === undefined ? undefined : set(value)
  const value =
    state.arr || isArray ? setFn(state.value) : mapAny(setFn, state.value)

  return { ...state, value }
}

const setupRootGetOrSet = (isGet: boolean, path: Path) =>
  isGet
    ? divide(root(get(path.substr(1))), plug())
    : divide(plug(), root(set(path.substr(1))))

const getOrSet = (isGet: boolean) => (path: Path): Operation => {
  if (path && path.startsWith('$')) {
    return setupRootGetOrSet(isGet, path)
  }

  const getFn = getter(path)
  const setFn = setter(path)
  const isArray = path.endsWith('[]')

  return () => (state: State): State =>
    (isGet
    ? !state.rev
    : state.rev)
      ? getValue(getFn, isArray, state)
      : setValue(setFn, isArray, state)
}

export const get = getOrSet(true)
export const set = getOrSet(false)
