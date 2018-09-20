import { Data, MapFunction, State } from '../types'

export default function value (val: Data): MapFunction {
  return (state: State) => ({
    ...state,
    value: (state.onlyMapped) ? undefined : val
  })
}
