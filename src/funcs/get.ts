import { MapFunction, State, Path } from '../types'
import getter from '../utils/pathGetter'

export default function get (path: Path | null): MapFunction {
  const get = getter(path)

  return (state: State): State => ({
    ...state,
    value: get(state.value)
  })
}
