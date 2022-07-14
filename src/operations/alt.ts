import { Operation, MapDefinition } from '../types'
import { setStateValue, getStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'
import { unescapeValue } from '../utils/escape'

export default function alt(
  fn: MapDefinition,
  undefinedValues: unknown[] = [undefined]
): Operation {
  return (options) => {
    const undefinedValuesUnescaped = undefinedValues.map(unescapeValue)
    const runAlt = mapFunctionFromDef(fn)(options)

    return (state) =>
      undefinedValuesUnescaped.includes(getStateValue(state))
        ? runAlt(setStateValue(state, state.context))
        : state
  }
}
