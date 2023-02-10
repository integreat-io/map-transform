/* eslint-disable security/detect-object-injection */
import { TransformerProps, DataMapper, Options } from '../types.js'
import xor from '../utils/xor.js'
import { ensureArray } from '../utils/array.js'
import { defsToDataMapper } from '../utils/definitionHelpers.js'
import { setTargetOnState } from '../utils/stateHelpers.js'

interface Props extends TransformerProps {
  path?: string | string[]
  sep?: string
}

function joinSplit(
  { path, sep = ' ' }: Props,
  split: boolean,
  _options: Options
): DataMapper {
  const pathArr = ensureArray(path)
  if (pathArr.length === 0) {
    return (data, { rev }) =>
      xor(split, rev)
        ? typeof data === 'string'
          ? data.split(sep)
          : undefined
        : Array.isArray(data)
        ? data.join(sep)
        : undefined
  }

  const getFns = pathArr.map(defsToDataMapper)
  const setFns = pathArr.map((path) => `>${path}`).map(defsToDataMapper)

  return (data, state) => {
    const fwdState = { ...state, rev: false } // Do a regular get/set regardless of direction

    if (xor(split, state.rev)) {
      const values = typeof data === 'string' ? data.split(sep) : []
      return setFns.reduce(
        (obj: unknown, setFn, index) =>
          setFn(values[index], setTargetOnState(fwdState, obj)),
        undefined
      )
    } else {
      const values = getFns.map((fn) => fn(data, fwdState))
      return values.filter((value) => value !== undefined).join(sep)
    }
  }
}

export function join(props: Props, options: Options = {}): DataMapper {
  return joinSplit(props, false, options)
}

export function split(props: Props, options: Options = {}): DataMapper {
  return joinSplit(props, true, options)
}
