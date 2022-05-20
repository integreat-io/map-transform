import {
  Operation,
  State,
  MapObject,
  Options,
  MapDefinition,
  MapPipe,
  Path,
} from '../types'
import { setStateValue, shouldSkipMutation } from '../utils/stateHelpers'
import { getValueFromState, set } from './getSet'
import { divide } from './directionals'
import iterate from './iterate'
import plug from './plug'
import { isMapObject, mapFunctionFromDef } from '../utils/definitionHelpers'
import { ensureArray } from '../utils/array'
import { isArrayPath } from '../utils/is'

const setIfPath = (map: unknown) => (typeof map === 'string' ? set(map) : map)

const flipIfNeeded = (pipe: MapPipe, shouldFlip: boolean) => {
  const pipeline = shouldFlip ? pipe.slice().reverse().map(setIfPath) : pipe
  return pipeline
}

const shouldIterate = (def: MapDefinition, path: Path) =>
  (isMapObject(def) && def['$iterate'] === true) || isArrayPath(path)

const shouldModify = (def: MapDefinition): def is MapObject =>
  isMapObject(def) && def['$modify'] === true

const extractRealPath = (path: Path) => {
  const [realPath, index] = path.split('/')
  return [realPath, index !== undefined] as const
}

const setTargetOnState = (state: State, target: unknown) => ({
  ...state,
  target,
})

const runWithTarget =
  (options: Options, state: State) =>
  (prevState: State | undefined, operation: Operation) =>
    operation(options)(setTargetOnState(state, prevState?.value))

const revertTarget = ({ target, ...state }: State, originalState: State) =>
  originalState.target ? setTargetOnState(state, originalState.target) : state

const run = (operations: Operation[], doModify: boolean, path: string) =>
  function (options: Options) {
    const shouldSkip = shouldSkipMutation(options)
    return (state: State) => {
      const prevState = doModify
        ? setStateValue(state, getValueFromState(path)(state))
        : undefined
      return shouldSkip(state)
        ? setStateValue(state, undefined)
        : revertTarget(
            operations.reduce(runWithTarget(options, state), prevState) ||
              state,
            state
          )
    }
  }

const objectToMapFunction = (
  objectDef: MapObject,
  shouldFlip: boolean,
  parentPath = ''
): Operation[] =>
  Object.entries(objectDef)
    .flatMap(([path, def]) => {
      if (!def || path.startsWith('$')) {
        // That last one is just to tell typescript we're not expecting `true` here
        return null
      }
      const [realPath, revOnly] = extractRealPath(path)
      const nextPath = [parentPath, realPath].filter(Boolean).join('.')

      if (
        isMapObject(def) &&
        !shouldIterate(def, nextPath) &&
        !shouldModify(def)
      ) {
        // This is a simple transform object -- traverse and join paths
        return objectToMapFunction(def, shouldFlip, nextPath)
      } else {
        // Create a new level -- either because this is an operation or an iterating/modifying transform object
        const subPipeline = isMapObject(def)
          ? [runAndIterate(def, shouldFlip, nextPath)]
          : flipIfNeeded(ensureArray(def), shouldFlip)
        const pipeline = mapFunctionFromDef([
          shouldFlip ? nextPath : null,
          ...subPipeline,
          shouldFlip ? null : set(nextPath),
        ] as MapPipe)

        return revOnly ? divide(plug(), pipeline) : pipeline
      }
    })
    .filter((pipeline): pipeline is Operation => !!pipeline)

function runAndIterate(def: MapObject, shouldFlip: boolean, nextPath = '') {
  const operations = objectToMapFunction(def, shouldFlip)
  const doModify = shouldModify(def)
  return shouldIterate(def, nextPath)
    ? iterate(run(operations, doModify, nextPath))
    : run(operations, doModify, nextPath)
}

export default function mutate(def: MapObject): Operation {
  if (Object.keys(def).length === 0) {
    return (_options) => (state) => setStateValue(state, undefined)
  }
  const shouldFlip = def.$flip === true
  const runMutation = runAndIterate(def, shouldFlip)

  return function mutateFn(options: Options) {
    const dir = def.$direction
    if (typeof dir === 'string') {
      if (dir === 'fwd' || dir === options.fwdAlias) {
        return (state: State) =>
          !state.rev ? runMutation(options)(state) : state
      } else if (dir === 'rev' || dir === options.revAlias) {
        return (state: State) =>
          state.rev ? runMutation(options)(state) : state
      }
    }
    return runMutation(options)
  }
}
