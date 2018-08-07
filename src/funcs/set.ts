import { compose, identity } from 'ramda'
import { State, MapFunction, Path, Data } from '../types'
import setter from '../utils/pathSetter'
import { getValue, setValue } from '../utils/stateHelpers'

export default function set (path: Path, mapFn: MapFunction): MapFunction {
  if (mapFn === null) {
    return identity
  }

  const isArray = path.endsWith('[]')
  const set = setter(path)
  const runMapping = compose(
    getValue,
    mapFn,
    setValue
  )

  return (state: State) => {
    const getAndSet = (from: Data, to?: Data) => set(runMapping(state, from), to)

    const value = (!isArray && Array.isArray(state.context))
      ? state.context.map((val) => getAndSet(val))
      : getAndSet(state.context, state.value)

    return { ...state, value }
  }
}
