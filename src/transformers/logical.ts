import { setTargetOnState, goForward } from '../utils/stateHelpers.js'
import { defToDataMapper } from '../utils/definitionHelpers.js'
import { TransformerProps, Path, DataMapper, Options } from '../types.js'

interface CompareProps extends TransformerProps {
  path?: Path | Path[]
  operator?: string
}

export default function logical(
  { path = '.', operator = 'AND' }: CompareProps,
  options?: Options
): DataMapper {
  const pathArr = ([] as string[]).concat(path)
  const getFns = pathArr.map((path) => defToDataMapper(path, options))
  const setFns = pathArr.map((path) => defToDataMapper(`>${path}`, options))
  const logicalOp =
    operator === 'OR'
      ? (a: unknown, b: unknown) => Boolean(a) || Boolean(b)
      : (a: unknown, b: unknown) => Boolean(a) && Boolean(b)

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
      const ret = values.reduce(logicalOp)
      return ret
    }
  }
}
