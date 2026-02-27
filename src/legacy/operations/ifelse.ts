import { getStateValue, goForward } from '../utils/stateHelpers.js'
import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'
import type {
  DataMapper,
  TransformDefinition,
  Operation,
  StateMapper,
  State,
} from '../types.js'

async function resolveCondition(
  conditionFn: StateMapper | DataMapper,
  conditionIsDataMapper: boolean,
  state: State,
): Promise<boolean> {
  if (conditionIsDataMapper) {
    return !!(await (conditionFn as DataMapper)(getStateValue(state), state))
  } else {
    return !!getStateValue(await (conditionFn as StateMapper)(goForward(state)))
  }
}

const createIfElseFn = (
  next: StateMapper,
  conditionFn: StateMapper | DataMapper,
  conditionIsDataMapper: boolean,
  trueFn: StateMapper,
  falseFn: StateMapper,
) => {
  return async (state: State) => {
    const nextState = await next(state)
    const bool = await resolveCondition(
      conditionFn,
      conditionIsDataMapper,
      nextState,
    )
    return bool ? await trueFn(nextState) : await falseFn(nextState)
  }
}

export default function (
  conditionDef?: DataMapper | TransformDefinition,
  trueDef?: TransformDefinition,
  falseDef?: TransformDefinition,
): Operation {
  return (options) => {
    if (!conditionDef) {
      return defToNextStateMapper(falseDef, options)
    }
    const conditionIsDataMapper = typeof conditionDef === 'function'
    const conditionFn = conditionIsDataMapper
      ? (conditionDef as DataMapper) // We know to expect a DataMapper here
      : defToNextStateMapper(conditionDef, options)(noopNext)
    const trueFn = defToNextStateMapper(trueDef, options)(noopNext)
    const falseFn = defToNextStateMapper(falseDef, options)(noopNext)

    return (next) =>
      createIfElseFn(next, conditionFn, conditionIsDataMapper, trueFn, falseFn)
  }
}
