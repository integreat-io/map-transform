import { Data, Operation, State } from '../types'

export default function fixed (val: Data): Operation {
  return () => (state: State) => ({
    ...state,
    value: val
  })
}
