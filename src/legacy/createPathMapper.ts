import {
  pathGetter as pathGetterNext,
  pathSetter as pathSetterNext,
} from '../createPathMapper.js'
import State from '../state.js'
import type { Path, DataMapperWithState } from './types.js'

export function pathGetter(path?: Path | null): DataMapperWithState {
  const getter = pathGetterNext(path)
  return (value, state) => {
    return getter(value, new State(state))
  }
}

export function pathSetter(path?: Path | null): DataMapperWithState {
  const setter = pathSetterNext(path)
  return (value, state) => {
    return setter(value, new State(state))
  }
}
