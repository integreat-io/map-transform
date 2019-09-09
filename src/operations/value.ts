import { Data, Operation, ValueFunction, State } from '../types'
import { extractValue } from '../functions/value'

export default function value(val: Data | ValueFunction): Operation {
  return () => (state: State) => ({
    ...state,
    value: state.onlyMapped ? undefined : extractValue(val)
  })
}
