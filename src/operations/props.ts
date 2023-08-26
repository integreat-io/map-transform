import iterate from './iterate.js'
import pipe from './pipe.js'
import { set } from './getSet.js'
import { divide } from './directionals.js'
import plug from './plug.js'
import type {
  Operation,
  State,
  TransformObject,
  Options,
  TransformDefinition,
  NextStateMapper,
} from '../types.js'
import {
  getStateValue,
  setStateValue,
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

// Return `true` if a direction is specified, and we're not going in that
// direction.
function isWrongDirection(direction: unknown, options: Options) {
  if (
    direction === 'rev' ||
    (options.revAlias && direction === options.revAlias)
  ) {
    // Only run fwd
    return (rev = false) => !rev
  } else if (
    direction === 'fwd' ||
    (options.fwdAlias && direction === options.fwdAlias)
  ) {
    // Only run rev
    return (rev = false) => rev
  } else {
    // Run both
    return () => false
  }
}

function runOperationWithOriginalValue({ value }: State) {
  return async (state: State, fn: NextStateMapper) => {
    const nextState = await fn(noopNext)(setStateValue(state, value))

    // Get the current state target and set the value as the target
    const target = state.target
    const nextValue = getStateValue(nextState)
    const thisState = setTargetOnState(nextState, nextValue)

    if (isObject(target) && isObject(nextValue)) {
      // TODO: This is a hack for making several sub objects work in reverse.
      // It's not clear to me why this is needed, and there is probably
      // something wrong somewhere else, that should be fixed instead
      const thisValue = { ...target, ...nextValue }
      return setStateValue(thisState, thisValue)
    } else if (isObject(target)) {
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
      pipeline = {
        ...pipeline,
        $iterate: pipeline.$iterate || isArr(prop),
      }
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

export default function props(def: TransformObject): Operation {
  return (options) => {
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
    const isWrongDirectionFn = isWrongDirection(def.$direction, options)

    // Return operation
    return (next) => {
      return async function doMutate(state) {
        const nextState = await next(state)
        if (
          isNonvalueState(nextState, options.nonvalues) ||
          isWrongDirectionFn(nextState.rev)
        ) {
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
}
