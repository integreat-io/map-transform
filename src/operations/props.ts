import iterate from './iterate.js'
import modify from './modify.js'
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
  StateMapper,
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

function isRegularProp(
  entry: [string, unknown]
): entry is [string, TransformDefinition] {
  const [prop, pipeline] = entry
  return prop[0] !== '$' && isTransformDefinition(pipeline)
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
  return async (state: State, fn: Operation) => {
    const nextState = await fn(options)(noopNext)(setStateValue(state, value))

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
  ]): Operation {
    // Adjust sub map object
    if (isTransformObject(pipeline)) {
      pipeline = {
        ...pipeline,
        $iterate: pipeline.$iterate || isArr(prop),
      }
    }

    // Handle slashed props
    const unslashedProp = removeSlash(prop)
    const onlyRev = prop !== unslashedProp // If these are different, we have removed a slash. Run in rev only

    // Prepare the operations and return as an operation
    const operations = [defToOperation(pipeline, options), set(unslashedProp)] // `pipeline` should not be flattened out with the `set`, to avoid destroying iteration logic
    return onlyRev ? divide(plug(), operations) : pipe(operations)
  }

function modifyWithGivenPath(
  path: string | undefined,
  options: Options,
  next: StateMapper
) {
  if (path) {
    const fn = modify(path)(options)(next)
    return async (state: State, nextState: State) =>
      await fn(setTargetOnState(state, getStateValue(nextState)))
  }

  return async (state: State, _nextState: State) => state
}

const runOperations =
  (
    modifyFn: (state: State, nextState: State) => Promise<State>,
    operations: Operation[],
    options: Options
  ) =>
  async (state: State) => {
    if (isNonvalueState(state, options.nonvalues)) {
      return state
    } else {
      const run = runOperationWithOriginalValue(state, options)
      let nextState: State = state
      for (const operation of operations) {
        nextState = await run(nextState, operation)
      }

      return modifyFn(nextState, state)
    }
  }

const setStateProps = (state: State, noDefaults?: boolean, flip?: boolean) => ({
  ...state,
  noDefaults: noDefaults || state.noDefaults || false,
  flip: flip || state.flip || false,
  target: undefined,
})

export default function props(def: TransformObject): Operation {
  if (Object.keys(def).length === 0) {
    return (_options) => (next) => async (state) =>
      setStateValue(await next(state), undefined)
  }

  // Prepare path
  const modifyPath = def.$modify === true ? '.' : def.$modify || undefined

  return (options) => {
    // Prepare one operation for each prop
    const operations = Object.entries(def)
      .filter(isRegularProp)
      .map(createSetPipeline(options))

    // Return operation
    return (next) => {
      const modifyFn = modifyWithGivenPath(modifyPath, options, noopNext)
      const run = runOperations(modifyFn, operations, options)
      const isWrongDirectionFn = isWrongDirection(def.$direction, options)

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
