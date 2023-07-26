import type { Operation } from '../types.js'
import { setStateValue, getTargetFromState } from '../utils/stateHelpers.js'

export default function plug(): Operation {
  return () => (_next) => async (state) =>
    setStateValue(state, getTargetFromState(state))
}
