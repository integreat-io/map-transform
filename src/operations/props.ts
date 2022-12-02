import iterate from './iterate'
import modify from './modify'
import pipe from './pipe'
import { set } from './getSet'
import { divide } from './directionals'
import plug from './plug'
import {
  Operation,
  State,
  MapObject,
  Options,
  MapDefinition,
  StateMapper,
} from '../types'
import {
  getStateValue,
  setStateValue,
  setTargetOnState,
  setValueFromState,
  isNoneValueState,
} from '../utils/stateHelpers'
import {
  isMapObject,
  isMapDefinition,
  operationFromDef,
} from '../utils/definitionHelpers'
import { identity } from '../utils/functional'
import { isObject } from '../utils/is'

function isRegularProp(
  entry: [string, unknown]
): entry is [string, MapDefinition] {
  const [prop, pipeline] = entry
  return prop[0] !== '$' && isMapDefinition(pipeline)
}

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

function runOperationWithOriginalValue({ value }: State, options: Options) {
  return (state: State, fn: Operation) => {
    const nextState = fn(options)(identity)(setStateValue(state, value))

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

function createSetPipeline(shouldFlip: boolean) {
  return ([prop, pipeline]: [string, MapDefinition]): Operation => {
    // Adjust sub map object
    if (isMapObject(pipeline)) {
      pipeline = {
        ...pipeline,
        $iterate: pipeline.$iterate || isArr(prop),
        $flip: shouldFlip,
      }
    }

    // Handle slashed props
    const unslashedProp = removeSlash(prop)
    const onlyRev = prop !== unslashedProp // If these are different, we have removed a slash. Run in rev only

    // Prepare the operations and return as an operation
    const operations = [operationFromDef(pipeline), set(unslashedProp)] // `pipeline` should not be flattened out with the `set`, to avoid destroying iteration logic
    return onlyRev ? divide(plug(), operations) : pipe(operations)
  }
}

function modifyWithGivenPath(
  path: string | undefined,
  options: Options,
  next: StateMapper
) {
  if (path) {
    const fn = modify(path)(options)(next)
    return (state: State, nextState: State) =>
      fn(setTargetOnState(state, getStateValue(nextState)))
  }

  return identity
}

const runOperations =
  (
    modifyFn: (state: State, nextState: State) => State,
    operations: Operation[],
    options: Options
  ) =>
  (shouldFlip: boolean) =>
  (state: State) => {
    return isNoneValueState(state, options.noneValues)
      ? state
      : modifyFn(
          operations.reduce(
            runOperationWithOriginalValue(state, options),
            setTargetOnState({ ...state, flip: shouldFlip }, undefined)
          ),
          state
        )
  }

export default function props(def: MapObject): Operation {
  if (Object.keys(def).length === 0) {
    return (_options) => (next) => (state) =>
      setStateValue(next(state), undefined)
  }

  // Prepare flags
  const modifyPath = def.$modify === true ? '.' : def.$modify || undefined
  const shouldIterate = def.$iterate === true
  const shouldFlip = def.$flip === true
  const direction = def.$direction

  // Prepare one operation for each prop
  const operations = Object.entries(def)
    .filter(isRegularProp)
    .map(createSetPipeline(shouldFlip))

  // Return operation
  return (options) => (next) => {
    const modifyFn = modifyWithGivenPath(modifyPath, options, identity)
    const run = runOperations(modifyFn, operations, options)
    const isWrongDirectionFn = isWrongDirection(direction, options)

    return function doMutate(state) {
      if (
        isNoneValueState(state, options.noneValues) ||
        isWrongDirectionFn(state.rev)
      ) {
        return next(state)
      }

      const thisState = shouldIterate
        ? iterate(() => () => run(shouldFlip))(options)(next)(state)
        : run(shouldFlip)(next(state))

      return setValueFromState(state, thisState)
    }
  }
}
