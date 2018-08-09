import { reverse } from 'ramda'
import { MapPipe, MapFunction, State } from '../types'
import { setValueFromState, pipeMapFns } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function pipe (def: MapPipe): MapFunction {
  const fns = def.map(mapFunctionFromDef)
  const runPipe = pipeMapFns(fns)
  const runRevPipe = pipeMapFns(reverse(fns))

  return (state: State) => setValueFromState(
    state,
    (state.rev) ? runRevPipe(state) : runPipe(state)
  )
}
