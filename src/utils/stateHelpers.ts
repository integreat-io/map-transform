/* eslint-disable @typescript-eslint/no-explicit-any */
import { State, Options } from '../types'

export const setStateValue = (state: State, value: unknown): State => ({
  ...state,
  value,
})
export const getStateValue = (state: State): any => state.value

export const setValueFromState = (state: State, { value }: State): State => ({
  ...state,
  value,
})

export const setTargetOnState = (state: State, target?: unknown): State => ({
  ...state,
  target,
})

export const populateState =
  ({ rev = false, onlyMapped = false }: Partial<State>) =>
  (data: unknown): State => ({
    root: data,
    context: data,
    value: data,
    rev,
    onlyMapped,
  })

export const shouldSkipMutation =
  ({ mutateNull = true }: Options) =>
  (state: State): boolean =>
    state.value === undefined || (!mutateNull && state.value === null)
