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
  // shouldSkipMutation,
  setValueFromState,
} from '../utils/stateHelpers'
import {
  isMapObject,
  isMapDefinition,
  operationsFromDef,
} from '../utils/definitionHelpers'
import { identity } from '../utils/functional'
import { isObject } from '../utils/is'

const setFlipOnState = (state: State, flip: boolean) =>
  flip ? { ...state, flip } : state

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

    if (isObject(target) && isObject(nextValue)) {
      // TODO: This is a hack for making several sub objects work in reverse.
      // It's not clear to me why this is needed, and there is probably
      // something wrong somewhere else, that should be fixed instead
      const thisValue = { ...target, ...nextValue }
      return setStateValue(setTargetOnState(nextState, nextValue), thisValue)
    } else {
      return setTargetOnState(nextState, nextValue)
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
    const operations = [operationsFromDef(pipeline), set(unslashedProp)].flat()
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
  (state: State) => {
    return getStateValue(state) !== undefined
      ? modifyFn(
          operations.reduce(
            runOperationWithOriginalValue(state, options),
            setTargetOnState(state, {})
          ),
          state
        )
      : state
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
    const modifyFn = modifyWithGivenPath(modifyPath, options, next)
    const run = runOperations(modifyFn, operations, options)
    const isWrongDirectionFn = isWrongDirection(direction, options)

    return function doMutate(state) {
      if (getStateValue(state) === undefined || isWrongDirectionFn(state.rev)) {
        return state
      }
      const stateWithFlip = setFlipOnState(state, shouldFlip)

      const thisState = shouldIterate
        ? iterate(() => () => run)(options)(next)(stateWithFlip)
        : run(next(stateWithFlip))

      return setValueFromState(state, thisState)
    }
  }
}
