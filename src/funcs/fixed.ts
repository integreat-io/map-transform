import { Data, MapFunction, State } from '../types'

export default function fixed (val: Data): MapFunction {
  return (state: State) => ({
    ...state,
    value: val
  })
}
