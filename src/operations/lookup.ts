import mapAny = require('map-any')
import pipe from './pipe.js'
import { Operation, State, Path, SimpleDataMapper } from '../types.js'
import { get } from './getSet.js'
import { getStateValue, setStateValue } from '../utils/stateHelpers.js'
import { dataMapperFromOperation } from '../utils/definitionHelpers.js'
import { identity } from '../utils/functional.js'

const matchPropInArray =
  (getProp: SimpleDataMapper) =>
  (arr: unknown[]) =>
  (value: string | number | boolean | null) =>
    arr.find((obj) => getProp(obj) === value)

const mapValue = (getArray: Operation, getProp: SimpleDataMapper) => {
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
    const getter = dataMapperFromOperation(pipe(get(propPath)))
    const mapValueFn = mapValue(pipe([arrayPath]), getter)

    return function doLookup(state) {
      const nextState = next(state)
      return setStateValue(
        nextState,
        mapAny(mapValueFn(nextState), getStateValue(nextState))
      )
    }
  }
}
