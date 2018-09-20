import * as mapAny from 'map-any'
import { MapFunction, State, Path } from '../types'
import getter, { GetFunction } from '../utils/pathGetter'
import setter, { SetFunction } from '../utils/pathSetter'

const getValue = (get: GetFunction, isArray: boolean, state: State): State => {
  const value = mapAny(get, state.value)
  const arr = !Array.isArray(state.value) && Array.isArray(value)

  return { ...state, value: (isArray && !value) ? [] : value, arr }
}

const setValue = (set: SetFunction, isArray: boolean, state: State): State => {
  const setFn: SetFunction = (value) => (state.onlyMapped && typeof value === 'undefined') ? value : set(value)
  const value = (state.arr || isArray) ? setFn(state.value) : mapAny(setFn, state.value)

  return { ...state, value }
}

const getOrSet = (isGet: boolean) => (path: Path): MapFunction => {
  const getFn = getter(path)
  const setFn = setter(path)
  const isArray = path.endsWith('[]')

  return (state: State): State => (isGet ? !state.rev : state.rev)
    ? getValue(getFn, isArray, state)
    : setValue(setFn, isArray, state)
}

export const get = getOrSet(true)
export const set = getOrSet(false)
