/* eslint-disable @typescript-eslint/no-explicit-any */
import { State, Options } from '../types'

export const setStateValue = (
  state: State,
  value: unknown,
  shouldPushContext = false
): State => ({
  ...state,
  context:
    shouldPushContext && state.value !== undefined
      ? [...state.context, state.value]
      : state.context,
  value,
})
export const getStateValue = (state: State): any => state.value

export const setValueFromState = (
  state: State,
  { value, context }: State,
  shouldSetContext = false
): State => ({
  ...state,
  value,
  context: shouldSetContext ? context : state.context,
})

export const getRootFromState = (state: State) =>
  state.context.length === 0 ? state.value : state.context[0]

export const getTargetFromState = (state: State) => state.target

export function setTargetOnState(state: State, target: unknown): State {
  return {
    ...state,
    target,
  }
}

export const getLastContext = (state: State) =>
  state.context[state.context.length - 1]

export const removeLastContext = (state: State) => ({
  ...state,
  context: state.context.slice(0, -1),
})

export const populateState =
  ({ rev = false, onlyMapped = false }: Partial<State>) =>
  (data: unknown): State => ({
    context: [],
    value: data,
    rev,
    onlyMapped,
  })

export const shouldSkipMutation =
  ({ mutateNull = true }: Options) =>
  (state: State): boolean =>
    state.value === undefined || (!mutateNull && state.value === null)
