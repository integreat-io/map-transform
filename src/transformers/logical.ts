import { getLogicalFn, Operator } from './logicalNext.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'
import { setTargetOnState, goForward } from '../utils/stateHelpers.js'
import type { AsyncTransformer, TransformerProps, Path } from '../types.js'
import { ensureArray } from '../utils/array.js'

export interface Props extends TransformerProps {
  path?: Path | Path[]
  operator?: Operator
}

// This transformer states that it only accepts paths, but it will still run
// pipelines when getting. When setting, it will fail if it gets something else
// than paths
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
