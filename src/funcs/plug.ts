import { State, MapFunction } from '../types'
import { setStateValue } from '../utils/stateHelpers'

export default function plug (): MapFunction {
  return (state: State) => setStateValue(state, undefined)
}
