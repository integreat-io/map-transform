import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { State, MapFunction, Operation } from '../types'

export default function operation (def: Operation): MapFunction {
  const { $op: op, ...operands } = def

  return (state: State) => (state.operations && typeof state.operations[op] === 'function')
    ? setStateValue(state, state.operations[op](getStateValue(state), operands))
    : state
}
