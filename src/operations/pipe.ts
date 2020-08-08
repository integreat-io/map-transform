import { MapPipe, Operation, State } from '../types'
import { compose, pipe as pipeFn } from '../utils/functional'
import { setValueFromState } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const liftState = (state: State) => ({
  ...state,
  context: state.value,
})

export default function pipe(defs: MapPipe): Operation {
  return (options) => {
    const fns = defs.map((def) => mapFunctionFromDef(def)(options))
    const runPipe = pipeFn(...fns)
    const runRevPipe = compose(...fns)

    return (state) =>
      setValueFromState(
        state,
        state.rev ? runRevPipe(liftState(state)) : runPipe(liftState(state))
      )
  }
}
