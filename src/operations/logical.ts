import { MapDefinition, Operation } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { operationFromDef } from '../utils/definitionHelpers'
import { identity } from '../utils/functional'

type LogicFn = (a: boolean, b: boolean) => boolean

const prepareLogical = (logicFn: LogicFn) =>
  function logical(...pipelines: MapDefinition[]): Operation {
    const fns = pipelines.map((pipeline) => operationFromDef(pipeline))

    return (options) => (next) =>
      function doLogical(state) {
        const nextState = next(state)
        const values = fns.map((fn) =>
          getStateValue(fn(options)(identity)(nextState))
        )
        return setStateValue(
          nextState,
          values.reduce((a, b) => logicFn(Boolean(a), Boolean(b)))
        )
      }
  }

export const and = prepareLogical((a, b) => a && b)
export const or = prepareLogical((a, b) => a || b)
