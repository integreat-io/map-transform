import * as mapAny from 'map-any'
import { MapFunction, State, Path } from '../types'
import getter from '../utils/pathGetter'
import setter from '../utils/pathSetter'

const getOrSet = (isGet: boolean) => (path: Path): MapFunction => {
  const get = getter(path)
  const set = setter(path)
  const isArray = path.endsWith('[]')

  return (state: State): State => {
    if (isGet ? !state.rev : state.rev) {
      const value = mapAny(get, state.value)
      return {
        ...state,
        value,
        arr: !Array.isArray(state.value) && Array.isArray(value)
      }
    } else {
      return {
        ...state,
        value: (state.arr || isArray) ? set(state.value) : mapAny(set, state.value)
      }
    }
  }
}

export const get = getOrSet(true)
export const set = getOrSet(false)
