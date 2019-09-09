import { Data, Operation, State, ValueFunction } from '../types'
import { extractValue } from '../functions/value'

export default function fixed(val: Data | ValueFunction): Operation {
  return () => (state: State) => ({
    ...state,
    value: extractValue(val)
  })
}
