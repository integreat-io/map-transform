import { compose, pipe as pipeR, apply } from 'ramda'
import { MapPipe, Operation, State, Options, StateMapper } from '../types'
import { setValueFromState } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function pipe (defs: MapPipe): Operation {
  return (options: Options) => {
    const fns = defs.map((def) => mapFunctionFromDef(def, options))
    const runPipe = apply(pipeR, fns) as StateMapper
    const runRevPipe = apply(compose, fns) as StateMapper

    return (state: State) => setValueFromState(
      state,
      (state.rev) ? runRevPipe(state) : runPipe(state)
    )
  }
}
