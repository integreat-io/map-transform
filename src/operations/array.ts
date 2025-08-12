import {
  setStateValue,
  getStateValue,
  setTargetOnState,
  revFromState,
  flipState,
} from '../utils/stateHelpers.js'
import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'
import { ensureArray } from '../utils/array.js'
import type {
  Operation,
  State,
  StateMapper,
  TransformDefinition,
} from '../types.js'

export interface Props {
  pipelines: TransformDefinition[]
  flip?: boolean
}

/**
 * Run each pipeline and return the values as an array.
 */
async function getValuesFromPipelines(state: State, pipelines: StateMapper[]) {
  const values: unknown[] = []
  for (const fn of pipelines) {
    const value = getStateValue(await fn(state))
    values.push(value)
  }
  return setStateValue(state, values)
}

/**
 * Run each pipeline on the value corresponding to its position in the
 * `pipelines` array, providing the result of each pipeline as the target of
 * the next.
 */
async function setValuesFromPipelines(state: State, pipelines: StateMapper[]) {
  let target: unknown = undefined
  const values = ensureArray(getStateValue(state))
  for (const [index, fn] of pipelines.entries()) {
    // eslint-disable-next-line security/detect-object-injection
    const value = values[index]
    const thisState = await fn(
      setStateValue(setTargetOnState(state, target), value),
    )
    target = getStateValue(thisState)
  }
  return setStateValue(state, target)
}

const createArrayFn = (
  next: StateMapper,
  fns: StateMapper[],
  doFlip: boolean,
) =>
  async function doConcat(state: State) {
    const nextState = flipState(await next(state), doFlip)
    return revFromState(nextState)
      ? setValuesFromPipelines(nextState, fns)
      : getValuesFromPipelines(nextState, fns)
  }

// Always return an empty array (or undefined in rev) when there are no
// pipelines.
const createEmptyFn =
  (next: StateMapper, doFlip: boolean) => async (state: State) =>
    setStateValue(
      await next(state),
      revFromState(state, doFlip) ? undefined : [],
    )

export default function alt({ pipelines, flip }: Props): Operation {
  return (options) => {
    const fns = pipelines.map((def) =>
      defToNextStateMapper(def, options)(noopNext),
    )

    if (fns.length === 0) {
      return (next) => createEmptyFn(next, !!flip)
    }

    return (next) => createArrayFn(next, fns, !!flip)
  }
}
