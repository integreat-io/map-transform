import mapAny from 'map-any'
import { pathGetter } from '../operations/getSet.js'
import { isObject, isString, isNonEmptyArray } from '../utils/is.js'
import { ensureArray } from '../utils/array.js'
import type { Transformer, TransformerProps, State } from '../types.js'

export interface Props extends TransformerProps {
  include?: string[]
  includePath?: string
  exclude?: string[]
  excludePath?: string
}

const projectProps = (rawProps: unknown[], doInclude: boolean) => {
  const props = rawProps.filter(isString)
  const filterFn = doInclude
    ? ([key]: [string, unknown]) => props.includes(key)
    : ([key]: [string, unknown]) => !props.includes(key)
  return (obj: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(obj).filter(filterFn))
}

const projectPropsFromPath = (
  path: string,
  rawProps: unknown[] | undefined,
  doInclude: boolean,
) => {
  const getFn = pathGetter(path)
  return (obj: Record<string, unknown>, state: State) => {
    let props = getFn(obj, state)
    if (props === undefined) {
      props = rawProps
    }
    if (!props) {
      return obj
    }
    return projectProps(ensureArray(props), doInclude)(obj)
  }
}

function prepareProjectFn(
  include?: string[],
  includePath?: string,
  exclude?: string[],
  excludePath?: string,
) {
  if (typeof includePath === 'string') {
    return projectPropsFromPath(includePath, include, true)
  } else if (typeof excludePath === 'string') {
    return projectPropsFromPath(excludePath, exclude, false)
  } else if (isNonEmptyArray(include)) {
    return projectProps(include, true)
  } else if (isNonEmptyArray(exclude)) {
    return projectProps(exclude, false)
  } else {
    return (obj: Record<string, unknown>) => obj
  }
}

const transformer: Transformer<Props> = function bucket({
  include,
  includePath,
  exclude,
  excludePath,
}) {
  // Pick the right project function
  const projectFn = prepareProjectFn(include, includePath, exclude, excludePath)

  // Return a transformer that will apply the project function to objects or
  // arrays of objects. Any non-object will replaced by `undefined`.
  return () => (data, state) =>
    mapAny(
      (data) =>
        isObject(data)
          ? state.rev
            ? data
            : projectFn(data, state)
          : undefined,
      data,
    )
}

export default transformer
