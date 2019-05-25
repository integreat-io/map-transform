import * as mapAny from 'map-any'
import { Operation, State, Path, Prop } from '../types'
import getter, { GetFunction } from '../utils/pathGetter'
import { get } from './getSet'
import { setStateValue } from '../utils/stateHelpers'

const matchPropInArray = (getProp: GetFunction) =>
  (arr: Prop[]) => (value: string | number | boolean | null) =>
    (arr as any[]).find((obj) => getProp(obj) === value)

const mapValue = (getArray: Operation, getProp: GetFunction) => {
  const matchInArray = matchPropInArray(getProp)
  return (state: State) => {
    if (state.rev) {
      return getProp
    } else {
      const { value: arr } = getArray({})(state)
      return (arr) ? matchInArray(arr as Prop[]) : () => undefined
    }
  }
}

export default function lookup (arrayPath: Path, propPath: Path): Operation {
  return () => {
    const mapValueFn = mapValue(get(arrayPath), getter(propPath))

    return (state: State) => setStateValue(
      state,
      mapAny(mapValueFn(state), state.value)
    )
  }
}
