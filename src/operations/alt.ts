import { Operation, MapDefinition } from '../types'
import {
  setStateValue,
  getStateValue,
  getLastContext,
  removeLastContext,
} from '../utils/stateHelpers'
import { operationFromDef } from '../utils/definitionHelpers'
import { unescapeValue } from '../utils/escape'
import { identity } from '../utils/functional'

export default function alt(
  fn: MapDefinition,
  undefinedValues: unknown[] = [undefined]
): Operation {
  return (options) => (next) => {
    const undefinedValuesUnescaped = undefinedValues.map(unescapeValue)
    const runAlt = operationFromDef(fn)(options)(identity)

    return function doAlt(state) {
      const nextState = next(state)
      return undefinedValuesUnescaped.includes(getStateValue(nextState))
        ? runAlt(
            setStateValue(
              removeLastContext(nextState),
              getLastContext(nextState)
            )
          )
        : nextState
    }
  }
}
