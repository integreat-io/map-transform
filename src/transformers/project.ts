import mapAny from 'map-any'
import { isObject, isString, isNonEmptyArray } from '../utils/is.js'
import type { Transformer, TransformerProps } from '../types.js'

export interface Props extends TransformerProps {
  include?: string[]
  exclude?: string[]
}

const projectProps = (rawProps: string[], doInclude: boolean) => {
  const props = rawProps.filter(isString)
  const filterFn = doInclude
    ? ([key]: [string, unknown]) => props.includes(key)
    : ([key]: [string, unknown]) => !props.includes(key)
  return (obj: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(obj).filter(filterFn))
}

const transformer: Transformer<Props> = function bucket({ include, exclude }) {
  // Pick the right project function
  const projectFn = isNonEmptyArray(include)
    ? projectProps(include, true)
    : isNonEmptyArray(exclude)
      ? projectProps(exclude, false)
      : (obj: Record<string, unknown>) => obj

  // Return a transformer that will apply the project function to objects or
  // arrays of objects. Any non-object will replaced by `undefined`.
  return () => (data, state) =>
    mapAny(
      (data) =>
        isObject(data) ? (state.rev ? data : projectFn(data)) : undefined,
      data,
    )
}

export default transformer
