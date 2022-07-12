import { MapDefinition, Operation } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import { mapFunctionFromDef } from '../utils/definitionHelpers'

type LogicFn = (a: boolean, b: boolean) => boolean

const prepareLogical = (logicFn: LogicFn) =>
  function logical(...pipelines: MapDefinition[]): Operation {
    const fns = pipelines.map(mapFunctionFromDef)

    return (options) => {
      return (state) => {
        const values = fns.map((fn) => getStateValue(fn(options)(state)))
        return setStateValue(
          state,
          values.reduce((a, b) => logicFn(Boolean(a), Boolean(b)))
        )
      }
    }
  }

export const and = prepareLogical((a, b) => a && b)
export const or = prepareLogical((a, b) => a || b)
