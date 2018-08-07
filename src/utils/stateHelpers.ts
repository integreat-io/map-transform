import { State, MapFunction, Data } from '../types'

export const setValue = (state: State, value: Data): State => ({ ...state, value })
export const getValue = (state: State): Data => state.value

export const setValueFromState = (state: State, { value }: State) => ({
  ...state,
  value
})

export const shiftState = (state: State) => ({
  ...state,
  context: state.value,
  value: undefined
})

export const pipeMapFns = (fns: MapFunction[]) => (state: State): State =>
  fns.reduce((state: State, fn: MapFunction) => fn(state), state)

export const populateState = (data: Data): State => ({
  root: data,
  context: data,
  value: data
})
