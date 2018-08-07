import { MapPipe, MapFunction, State } from '../types'
import { setValueFromState, pipeMapFns } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

export default function pipe (def: MapPipe): MapFunction {
  const runPipe = pipeMapFns(def.map(mapFunctionFromDef))

  return (state: State) => setValueFromState(
    state,
    runPipe(state)
  )
}
