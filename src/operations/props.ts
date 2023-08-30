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
import { isObject, isNotNullOrUndefined } from '../utils/is.js'
import type {
  Operation,
  State,
  TransformObject,
  Options,
  TransformDefinition,
  StateMapper,
  NextStateMapper,
  Pipeline,
} from '../types.js'

function pathHasModify(path: string) {
  const index = path.indexOf('$modify')
  return (
    index > -1 && // We have a $modify
    (index === 0 || path[index - 1] === '.') && // It's either the first char, or preceded by a dot
    (path.length === index + 7 || path[index + 7] === '.') // It's either the last char, or followed by a dot
  )
}

function isPathWithModify(pipeline: unknown) {
  if (Array.isArray(pipeline)) {
    return pipeline.some(isPathWithModify)
  } else if (typeof pipeline !== 'string') {
    return false
  } else {
    return pathHasModify(pipeline)
  }
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
  return async (state: State, fn: StateMapper) => {
    const nextState = await fn(setStateValue(state, value))

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

function createDirectionalOperation(
  pipeline: Pipeline,
  onlyFwd: boolean,
  onlyRev: boolean
) {
  if (onlyRev && onlyFwd) {
    return undefined // Don't run anything when both directions are disabled
  } else if (onlyRev) {
    return divide(plug(), pipeline) // Plug going forward
  } else if (onlyFwd) {
    return divide(pipeline, plug()) // Plug going in reverse
  } else {
    return pipe(pipeline) // Run in both directions
  }
}

const createSetPipeline = (options: Options) =>
  function createSetPipeline([prop, pipeline]: [string, TransformDefinition]):
    | Operation
    | undefined {
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
    return createDirectionalOperation(operations, onlyFwd, onlyRev)
  }

const runOperations =
  (stateMappers: NextStateMapper[], options: Options) =>
  async (state: State) => {
    if (isNonvalueState(state, options.nonvalues)) {
      return state
    } else {
      const run = runOperationWithOriginalValue(state)
      let nextState: State = state
      for (const stateMapper of stateMappers) {
        nextState = await run(nextState, stateMapper(noopNext)) // We call `noopNext` here to avoid running recursive pipelines more times than the data dictates
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

const createStateMappers = (def: TransformObject, options: Options) =>
  Object.entries(def)
    .filter(isRegularProp)
    .sort(sortProps)
    .map(createSetPipeline(options))
    .filter(isNotNullOrUndefined)
    .map((fn) => fn(options))

// Prepare one operation that will run all the prop pipelines
function prepareOperation(def: TransformObject): Operation {
  return (options) => {
    // Prepare one state mapper for each prop
    const nextStateMappers = createStateMappers(fixModifyPath(def), options)

    // When there's no props on the transform object, return an operation that
    // simply sets value to an empty object
    if (nextStateMappers.length === 0) {
      return (next) => async (state) => setStateValue(await next(state), {}) // TODO: Not sure if we need to call `next()` here
    }

    // Prepare operations runner
    const run = runOperations(nextStateMappers, options)
    const runWithIterateWhenNeeded =
      def.$iterate === true ? iterate(() => () => run)(options)(noopNext) : run

    return (next) => {
      return async function doMutate(state) {
        const nextState = await next(state)

        // Don't touch state if its value is a nonvalue
        if (isNonvalueState(nextState, options.nonvalues)) {
          return nextState
        }

        // Don't pass on iteration to props
        const propsState = stopIteration(
          setStateProps(nextState, def.$noDefaults, def.$flip)
        )

        // Run the props operations
        const thisState = await runWithIterateWhenNeeded(propsState)

        // Set the value, but keep the target
        return setValueFromState(nextState, thisState)
      }
    }
  }
}

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
  const operation = prepareOperation(def)
  return wrapInDirectional(operation, def.$direction) // Wrap operation in a directional operation, if a $direction is specified
}
