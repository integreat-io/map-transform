import { MapPipe, Operation, State, StateMapper } from '../types'
import { setValueFromState, setTargetOnState } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'
import { identity } from '../utils/functional'

const liftState = (state: State) => ({
  ...state,
  context: state.value,
})

const callWithNextTarget =
  (next: StateMapper, thisMapper: StateMapper, prevMapper?: StateMapper) =>
  (state: State) => {
    const nextTarget =
      prevMapper && typeof prevMapper.getTarget === 'function'
        ? prevMapper.getTarget(state)
        : state.target
    const nextState = setTargetOnState(state, nextTarget)
    return setTargetOnState(thisMapper(next(nextState)), state.target)
  }

export default function pipe(defs: MapPipe): Operation {
  return (options) => {
    if (defs.length === 0) {
      return identity
    }

    const fns = defs.map((def) => mapFunctionFromDef(def)(options))
    const runPipe = fns.reduce(
      (next: StateMapper, fn, index) =>
        callWithNextTarget(next, fn, fns[index + 1]),
      identity
    )
    const runRevPipe = fns.reduceRight(
      (next: StateMapper, fn, index) =>
        callWithNextTarget(next, fn, fns[index - 1]),
      identity
    )

    return (state) =>
      setValueFromState(
        state,
        state.rev ? runRevPipe(liftState(state)) : runPipe(liftState(state))
      )
  }
}
