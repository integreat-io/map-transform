import { State, Data, Options } from '../types'

export const setStateValue = (state: State, value: Data): State => ({
  ...state,
  value
})
export const getStateValue = (state: State): Data => state.value

export const setValueFromState = (state: State, { value }: State) => ({
  ...state,
  value
})

export const contextFromState = ({
  rev = false,
  onlyMapped = false
}: State) => ({
  rev,
  onlyMappedValues: onlyMapped
})

export const populateState = ({ rev = false, onlyMapped = false }) => (
  data: Data
): State => ({
  root: data,
  context: data,
  value: data,
  rev,
  onlyMapped
})

export const shouldMutate = ({ mutateNull = true }: Options) => (
  state: State
) => state.value === undefined || (!mutateNull && state.value === null)
