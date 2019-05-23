import { State, MapFunction, Data } from '../types'

export const setStateValue = (state: State, value: Data): State => ({ ...state, value })
export const getStateValue = (state: State): Data => state.value

export const setValueFromState = (state: State, { value }: State) => ({
  ...state,
  value
})

export const liftState = (state: State) => ({
  ...state,
  context: state.value,
  value: undefined,
  arr: false
})

export const lowerState = (state: State) => ({
  ...state,
  value: state.context
})

export const pipeMapFns = (fns: MapFunction[]) => (state: State): State =>
  fns.reduce((state: State, fn: MapFunction) => fn(state), state)

export const populateState = ({ rev = false, onlyMapped = false, operations = {} }) => (data: Data): State => ({
  root: data,
  context: data,
  value: data,
  rev,
  onlyMapped,
  operations
})
