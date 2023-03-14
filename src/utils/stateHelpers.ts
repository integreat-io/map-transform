/* eslint-disable @typescript-eslint/no-explicit-any */
import { State } from '../types.js'

// Context

export const pushContext = (state: State, value: unknown) => ({
  ...state,
  context: [...state.context, value],
})

export const getLastContext = (state: State) =>
  state.context[state.context.length - 1]

export const removeLastContext = (state: State) => ({
  ...state,
  context: state.context.slice(0, -1),
})

// Root

export const getRootFromState = (state: State) =>
  state.context.length === 0 ? state.value : state.context[0]

// Target

export const getTargetFromState = (state: State) => state.target

export function setTargetOnState(state: State, target: unknown): State {
  return {
    ...state,
    target,
  }
}

// State value

export const setStateValue = (
  state: State,
  value: unknown,
  shouldPushContext = false
): State =>
  shouldPushContext && state.value !== undefined
    ? {
        ...pushContext(state, state.value),
        value,
      }
    : { ...state, value }

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

export const isNoneValueState = (
  state: State,
  nonvalues: unknown[] = [undefined]
) => nonvalues.includes(state.value)

// State

export const populateState =
  ({ rev = false, noDefaults = false, target = undefined }: Partial<State>) =>
  (data: unknown): State => ({
    context: [],
    value: data,
    target,
    rev,
    noDefaults,
  })

export const goForward = (state: State) => ({
  ...state,
  rev: false,
  flip: false,
})

export const stopIteration = (state: State) => ({ ...state, iterate: false })
