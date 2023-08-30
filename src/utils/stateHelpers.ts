import xor from './xor.js'
import type { State, InitialState } from '../types.js'

// Context

export const getLastContext = (state: State) =>
  state.context[state.context.length - 1]

export const removeLastContext = (state: State) => ({
  ...state,
  context: state.context.slice(0, -1),
})

export const pushContext = (state: State, value: unknown) => ({
  ...state,
  context: [...state.context, value],
})

export const popContext = (state: State) => ({
  ...state,
  context: state.context.slice(0, -1),
  value: state.context[state.context.length - 1],
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
  { untouched, ...state }: State, // Clear untouched every time we set a value
  value: unknown,
  shouldPushContext = false
): State =>
  shouldPushContext && state.value !== undefined
    ? {
        ...pushContext(state, state.value),
        value,
      }
    : { ...state, value }

export const getStateValue = (state: State): unknown => state.value

export const setValueFromState = (
  state: State,
  { value }: State,
  shouldPushContext = false
): State => setStateValue(state, value, shouldPushContext)

export const isNonvalue = (
  value: unknown,
  nonvalues: unknown[] = [undefined]
) => nonvalues.includes(value)

export const isNonvalueState = (
  state: State,
  nonvalues: unknown[] = [undefined]
) => isNonvalue(state.value, nonvalues)

export const markAsUntouched = (state: State) => ({ ...state, untouched: true })
export const clearUntouched = ({ untouched, ...state }: State) => state
export const isUntouched = ({ untouched }: State) => !!untouched

// State

export const populateState = (
  data: unknown,
  { rev = false, noDefaults = false, target = undefined }: InitialState
): State => ({
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

export const flipState = (state: State, flip = true) => ({
  ...state,
  flip: xor(state.flip, flip),
})

export const stopIteration = (state: State) => ({ ...state, iterate: false })

export const noopNext = async (state: State) => state

export const revFromState = (state: State, flip = false) =>
  flip ? xor(state.rev, !state.flip) : xor(state.rev, state.flip)
