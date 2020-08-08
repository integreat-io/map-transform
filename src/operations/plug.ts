import { Operation } from '../types'
import { setStateValue } from '../utils/stateHelpers'

export default function plug(): Operation {
  return () => (state) => setStateValue(state, undefined)
}
