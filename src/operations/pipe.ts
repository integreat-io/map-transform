import { MapPipe, Operation, State, StateMapper } from '../types'
import { pipe as pipeFn, compose } from '../utils/functional'
import { setValueFromState, setTargetOnState } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

const liftState = (state: State) => ({
  ...state,
  context: state.value,
})

const callWithNextTarget =
  (nextFn: StateMapper, thisFn?: StateMapper) => (state: State) => {
    const nextTarget =
      thisFn && typeof thisFn.getTarget === 'function'
        ? thisFn.getTarget(state)
        : state.target
    const nextState = nextFn(setTargetOnState(state, nextTarget))
    return setTargetOnState(nextState, state.target)
  }

export default function pipe(defs: MapPipe): Operation {
  return (options) => {
    const fns = defs.map((def) => mapFunctionFromDef(def)(options))
    const runPipe = pipeFn(
      ...fns.map((fn, index) => callWithNextTarget(fn, fns[index + 1]))
    )
    const runRevPipe: StateMapper = compose(
      ...fns.map((fn, index) => callWithNextTarget(fn, fns[index - 1]))
    )

    return (state) =>
      setValueFromState(
        state,
        state.rev ? runRevPipe(liftState(state)) : runPipe(liftState(state))
      )
  }
}
