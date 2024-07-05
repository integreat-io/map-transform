import type {
  Operation,
  TransformDefinition,
  State,
  StateMapper,
} from '../types.js'
import {
  pushContext,
  getStateValue,
  setStateValue,
  getTargetFromState,
  setTargetOnState,
} from '../utils/stateHelpers.js'
import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import { indexOfIfArray } from '../utils/array.js'
import { noopNext } from '../utils/stateHelpers.js'

const runIterationStep = async (
  fn: StateMapper,
  state: State,
  value: unknown,
  index: number,
  target: unknown,
) =>
  getStateValue(
    await fn(
      setTargetOnState(
        { ...state, index, value },
        indexOfIfArray(target, index),
      ),
    ),
  )

export const iterateState =
  (fn: StateMapper) => async (state: State, target: unknown) => {
    const values = getStateValue(state)

    if (!Array.isArray(values)) {
      // This is not an array, so we just run the mapper function on the value
      return await runIterationStep(fn, state, values, 0, target)
    }

    const nextState = pushContext(state, values)
    const nextValue: unknown[] = []
    for (const [index, value] of values.entries()) {
      // Iterate through the values and run the mapper function on each value
      nextValue.push(
        await runIterationStep(fn, nextState, value, index, target),
      )
    }
    return nextValue
  }

export default function iterate(def: TransformDefinition): Operation {
  if (!def || (typeof def === 'object' && Object.keys(def).length === 0)) {
    return (_options) => (next) => async (state) =>
      setStateValue(await next(state), undefined)
  }
  return (options) => {
    const fn = defToNextStateMapper(def, options)
    return (next) => {
      const runIteration = iterateState(fn(noopNext))
      return async function doIterate(state) {
        const nextState = await next(state)

        return setStateValue(
          nextState,
          await runIteration(nextState, getTargetFromState(nextState)),
        )
      }
    }
  }
}
