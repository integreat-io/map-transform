import mapAny = require('map-any')
import { Operation, State, Path } from '../types'
import getter, { Getter } from '../utils/pathGetter'
import { get } from './getSet'
import { setStateValue } from '../utils/stateHelpers'

const matchPropInArray =
  (getProp: Getter) =>
  (arr: unknown[]) =>
  (value: string | number | boolean | null) =>
    arr.find((obj) => getProp(obj) === value)

const mapValue = (getArray: Operation, getProp: Getter) => {
  const matchInArray = matchPropInArray(getProp)
  return (state: State) => {
    if (state.rev) {
      return getProp
    } else {
      const { value: arr } = getArray({})(state)
      return arr ? matchInArray(arr as unknown[]) : () => undefined
    }
  }
}

export default function lookup(arrayPath: Path, propPath: Path): Operation {
  return () => {
    const mapValueFn = mapValue(get(arrayPath), getter(propPath))

    return (state) =>
      setStateValue(state, mapAny(mapValueFn(state), state.value))
  }
}
