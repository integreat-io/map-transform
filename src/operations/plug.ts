import { Operation } from '../types'
import { setStateValue, getTargetFromState } from '../utils/stateHelpers'

export default function plug(): Operation {
  return () => (_next) => (state) =>
    setStateValue(state, getTargetFromState(state))
}
