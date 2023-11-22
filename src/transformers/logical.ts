import { setTargetOnState, goForward } from '../utils/stateHelpers.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'
import type { AsyncTransformer, TransformerProps, Path } from '../types.js'
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

// TODO: Should handle pipelines, not just paths
const transformer: AsyncTransformer<Props> = function logical({
  path = '.',
  operator = 'AND',
}) {
  return (options) => {
    const pathArr = ensureArray(path)
    const getFns = pathArr.map((path) => defToDataMapper(path, options))
    const setFns = pathArr.map((path) => defToDataMapper(`>${path}`, options))

    const logicalOp = getLogicalFn(operator)

    return async (data, state) => {
      if (state.rev) {
        const value = Boolean(data)
        let obj: unknown
        for (const setFn of setFns) {
          obj = await setFn(value, setTargetOnState(goForward(state), obj))
        }
        return obj
      } else {
        const values = []
        for (const getFn of getFns) {
          values.push(await getFn(data, state))
        }
        return values.reduce(logicalOp)
      }
    }
  }
}

export default transformer
