import mapAny = require('map-any')
import pipe from './pipe'
import { Operation, State, Path } from '../types'
import getter, { Getter } from '../utils/pathGetter'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { identity } from '../utils/functional'

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
      const { value: arr } = getArray({})(identity)(state)
      return arr ? matchInArray(arr as unknown[]) : () => undefined
    }
  }
}

export default function lookup(arrayPath: Path, propPath: Path): Operation {
  return () => (next) => {
    const mapValueFn = mapValue(pipe([arrayPath]), getter(propPath))

    return function doLookup(state) {
      const nextState = next(state)
      return setStateValue(
        nextState,
        mapAny(mapValueFn(nextState), getStateValue(nextState))
      )
    }
  }
}
