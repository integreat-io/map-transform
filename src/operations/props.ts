import iterate from './iterate.js'
import pipe from './pipe.js'
import { set } from './getSet.js'
import { divide, fwd, rev } from './directionals.js'
import plug from './plug.js'
import {
  getStateValue,
  setStateValue,
  getTargetFromState,
  setTargetOnState,
  setValueFromState,
  isNonvalueState,
  stopIteration,
} from '../utils/stateHelpers.js'
import {
  isTransformObject,
  isTransformDefinition,
  defToOperation,
} from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'
import { isObject } from '../utils/is.js'
import type {
  Operation,
  State,
  TransformObject,
  Options,
  TransformDefinition,
  NextStateMapper,
} from '../types.js'

function isPathWithModify(pipeline: unknown) {
  if (Array.isArray(pipeline)) {
    return pipeline.some(isPathWithModify)
  } else if (typeof pipeline !== 'string') {
    return false
  }
  const index = pipeline.indexOf('$modify')
  return (
    index > -1 && // We have a $modify
    (index === 0 || pipeline[index - 1] === '.') && // It's either the first char, or preceded by a dot
    (pipeline.length === index + 7 || pipeline[index + 7] === '.') // It's either the last char, or followed by a dot
  )
}

// Keep props that don't start with a $ and have a transform definition as
// value. We'll also keep props with a `$modify` path, unless it also have a
// `$modify` path in the pipeline, in which case it won't do anything anyway, so
// we remove it.
function isRegularProp(
  entry: [string, unknown]
): entry is [string, TransformDefinition] {
  const [prop, pipeline] = entry
  return (
    (prop[0] !== '$' ||
      (isPathWithModify(prop) && !isPathWithModify(pipeline))) &&
    isTransformDefinition(pipeline)
  )
}

// Sort props and pipelines with a $modify path last
function sortProps(
  [aProp, aPipeline]: [string, unknown],
  [bProp, bPipeline]: [string, unknown]
) {
  const aIsModify = isPathWithModify(aProp) || isPathWithModify(aPipeline)
  const bIsModify = isPathWithModify(bProp) || isPathWithModify(bPipeline)
  return Number(aIsModify) - Number(bIsModify) // Sort any $modify path last
}

const checkDirection = (
  requiredDirection: unknown,
  directionKeyword: string,
  directionAlias?: string
) =>
  requiredDirection === directionKeyword ||
  (directionAlias && requiredDirection === directionAlias)

// Wraps the given operation in `fwd` or `rev` if a direction is specified.
function wrapInDirectional(operation: Operation, direction: unknown) {
  return (options: Options) => {
    if (checkDirection(direction, 'rev', options.revAlias)) {
      return rev(operation)(options) // Only in reverse
    } else if (checkDirection(direction, 'fwd', options.fwdAlias)) {
      return fwd(operation)(options) // Only going forward
    } else {
      return operation(options) // Run in both directions
    }
  }
}

// Merge target and state if they are both objects
const mergeTargetAndValueOperation: Operation = () => (next) =>
  async function mergeTargetAndValue(state) {
    const nextState = await next(state)
    const target = getTargetFromState(nextState)
    const value = getStateValue(nextState)
    return isObject(target) && isObject(value)
      ? setStateValue(nextState, { ...target, ...value })
      : nextState
  }

function runOperationWithOriginalValue({ value }: State) {
  return async (state: State, fn: NextStateMapper) => {
    const nextState = await fn(noopNext)(setStateValue(state, value))

    // Get the current state target and set the value as the target
    const target = getTargetFromState(state)
    const nextValue = getStateValue(nextState)
    const thisState = setTargetOnState(nextState, nextValue)

    if (isObject(target) && !isObject(nextValue)) {
      // If the pipeline returns a non-object value, but the target is an
      // object, we return the target. The reason behind this is that we're
      // building an object here, and when a pipeline returns a non-object, it's
      // usually because of a `value()` intended for only one direction.
      return setStateValue(thisState, target)
    } else {
      // The normal case -- return what the pipeline returned
      return thisState
    }
  }
}

const isArr = (prop: string) =>
  prop.endsWith('[]') && prop[prop.length - 3] !== '\\'

const isNumeric = (value: string) => !Number.isNaN(Number.parseInt(value, 10))

function removeSlash(prop: string) {
  const index = prop.indexOf('/')
  if (
    index > -1 &&
    prop[index - 1] !== '\\' &&
    isNumeric(prop.slice(index + 1))
  ) {
    return prop.slice(0, index)
  }

  return prop
}

const createSetPipeline = (options: Options) =>
  function createSetPipeline([prop, pipeline]: [
    string,
    TransformDefinition
  ]): NextStateMapper {
    // Adjust sub map object
    if (isTransformObject(pipeline)) {
      pipeline = [
        rev(mergeTargetAndValueOperation), // This will make sure the result of this pipeline is merged with the target in reverse
        {
          ...pipeline,
          $iterate: pipeline.$iterate || isArr(prop),
        },
      ]
    }

    // Handle slashed props
    const unslashedProp = removeSlash(prop)
    const isSlashed = prop !== unslashedProp // If these are different, we have removed a slash
    const onlyFwd = isPathWithModify(unslashedProp)
    const onlyRev = isSlashed || isPathWithModify(pipeline)

    // Prepare the operations and return as an operation
    const operations = [defToOperation(pipeline, options), set(unslashedProp)] // `pipeline` should not be flattened out with the `set`, to avoid destroying iteration logic
    return onlyRev
      ? divide(plug(), operations)(options) // Plug going forward
      : onlyFwd
      ? divide(operations, plug())(options) // Plug going in reverse
      : pipe(operations)(options) // Run in both directions
  }

const runOperations =
  (operations: NextStateMapper[], options: Options) => async (state: State) => {
    if (isNonvalueState(state, options.nonvalues)) {
      return state
    } else {
      const run = runOperationWithOriginalValue(state)
      let nextState: State = state
      for (const operation of operations) {
        nextState = await run(nextState, operation)
      }

      return nextState
    }
  }

const setStateProps = (state: State, noDefaults?: boolean, flip?: boolean) => ({
  ...state,
  noDefaults: noDefaults || state.noDefaults || false,
  flip: flip || state.flip || false,
  target: undefined,
})

const fixModifyPath = (def: TransformObject) =>
  def.$modify === true ? { ...def, $modify: '.' } : def

/**
 * Maps to an object by running the object values as pipelines and setting the
 * resulting values with the keys as paths – going forward. Will work in reverse
 * too, as each prop and pipeline are merged into one pipeline, with the key
 * path in a `set` operation at the end. So when running in reverse, the `set`
 * will `get` and vice versa.
 *
 * Supports $modify paths, $iterate, $noDefaults, $flip, and $direction.
 */
export default function props(def: TransformObject): Operation {
  const operation: Operation = (options) => {
    // Prepare one operation for each prop
    const nextStateMappers = Object.entries(fixModifyPath(def))
      .filter(isRegularProp)
      .sort(sortProps)
      .map(createSetPipeline(options))

    // When there's no props on the transform object, return an operation that
    // simply sets value to an empty object
    if (nextStateMappers.length === 0) {
      return (next) => async (state) => setStateValue(await next(state), {}) // TODO: Not sure if we need to call `next()` here
    }

    const run = runOperations(nextStateMappers, options)

    // Return operation
    return (next) => {
      return async function doMutate(state) {
        const nextState = await next(state)
        if (isNonvalueState(nextState, options.nonvalues)) {
          return nextState
        }

        const propsState = stopIteration(
          setStateProps(nextState, def.$noDefaults, def.$flip)
        ) // Don't pass on iteration to props
        const thisState =
          def.$iterate === true
            ? await iterate(() => () => run)(options)(noopNext)(propsState)
            : await run(propsState)

        return setValueFromState(nextState, thisState)
      }
    }
  }

  // Wrap operation in a directional operation, if a $direction is specified
  return wrapInDirectional(operation, def.$direction)
}
