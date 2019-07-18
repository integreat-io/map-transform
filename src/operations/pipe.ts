import { MapPipe, Operation, State, Options } from '../types'
import { compose, pipe as pipeFn } from '../utils/functional'
import { setValueFromState } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function pipe (defs: MapPipe): Operation {
  return (options: Options) => {
    const fns = defs.map((def) => mapFunctionFromDef(def, options))
    const runPipe = pipeFn(...fns)
    const runRevPipe = compose(...fns)

    return (state: State) => setValueFromState(
      state,
      (state.rev) ? runRevPipe(state) : runPipe(state)
    )
  }
}
