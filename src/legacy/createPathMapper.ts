import {
  pathGetter as pathGetterNext,
  pathSetter as pathSetterNext,
} from '../createPathMapper.js'
import State from '../state.js'
import type { Path, DataMapper } from './types.js'

export function pathGetter(path?: Path | null): DataMapper {
  const getter = pathGetterNext(path)
  return async (value, state) => {
    return getter(value, new State(state))
  }
}

export function pathSetter(path?: Path | null): DataMapper {
  const setter = pathSetterNext(path)
  return async (value, state) => {
    return setter(value, new State(state))
  }
}
