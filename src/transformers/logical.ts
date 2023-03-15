import { setTargetOnState, goForward } from '../utils/stateHelpers.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'
import { Transformer, TransformerProps, Path } from '../types.js'
import { ensureArray } from '../utils/array.js'

export type Operator = 'AND' | 'OR'

export interface Props extends TransformerProps {
  path?: Path | Path[]
  operator?: Operator
}

const getLogicalFn = (operator: Operator) =>
  operator === 'OR'
    ? (a: unknown, b: unknown) => Boolean(a) || Boolean(b)
    : (a: unknown, b: unknown) => Boolean(a) && Boolean(b)

const transformer: Transformer<Props> = function logical({
  path = '.',
  operator = 'AND',
}) {
  return (options) => {
    const pathArr = ensureArray(path)
    const getFns = pathArr.map((path) => defToDataMapper(path, options))
    const setFns = pathArr.map((path) => defToDataMapper(`>${path}`, options))

    const logicalOp = getLogicalFn(operator)

    return (data, state) => {
      if (state.rev) {
        const value = Boolean(data)
        return setFns.reduce(
          (obj: unknown, setFn) =>
            setFn(value, setTargetOnState(goForward(state), obj)),
          undefined
        )
      } else {
        const values = getFns.map((fn) => fn(data, state))
        return values.reduce(logicalOp)
      }
    }
  }
}

export default transformer
