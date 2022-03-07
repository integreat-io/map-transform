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
import { set } from './getSet'
import { divide } from './directionals'
import iterate from './iterate'
import { isMapObject, mapFunctionFromDef } from '../utils/definitionHelpers'
import { ensureArray } from '../utils/array'

const setIfPath = (map: unknown) => (typeof map === 'string' ? set(map) : map)

const flipIfNeeded = (pipe: MapPipe, flip: boolean) => {
  const pipeline = flip ? pipe.slice().reverse().map(setIfPath) : pipe
  return pipeline
}

const shouldIterate = (def: MapDefinition, path: Path) =>
  (isMapObject(def) && def['$iterate'] === true) || path.includes('[]')

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

const run = (operations: Operation[]) =>
  function (options: Options) {
    const shouldSkip = shouldSkipMutation(options)
    return (state: State) =>
      shouldSkip(state)
        ? setStateValue(state, undefined)
        : revertTarget(
            operations.reduce(runWithTarget(options, state), undefined) ||
              state,
            state
          )
  }

const objectToMapFunction = (
  objectDef: MapObject,
  flip: boolean,
  parentPath = ''
): Operation[] =>
  Object.entries(objectDef)
    .flatMap(([path, def]) => {
      if (!def || path.startsWith('$')) {
        return null
      }
      const [realPath, revOnly] = extractRealPath(path)
      const nextPath = [parentPath, realPath].filter(Boolean).join('.')

      if (isMapObject(def) && !def.$iterate && !realPath.endsWith('[]')) {
        // This is a simple transform object -- traverse and join paths
        return objectToMapFunction(def, flip, nextPath)
      } else {
        // Create a new level -- either because this is a operation or a iterating transform object
        const subPipeline = isMapObject(def)
          ? [runAndIterate(def, flip, shouldIterate(def, nextPath))]
          : flipIfNeeded(ensureArray(def), flip)
        const pipeline = mapFunctionFromDef([
          flip ? nextPath : null,
          ...subPipeline,
          flip ? null : set(nextPath),
        ] as MapPipe)

        return revOnly
          ? divide(
              () => (state) => setStateValue(state, state.target), // Simply pass on target going forward
              pipeline
            )
          : pipeline
      }
    })
    .filter((pipeline): pipeline is Operation => !!pipeline)

function runAndIterate(def: MapObject, flip: boolean, doIterate: boolean) {
  const operations = objectToMapFunction(def, flip)
  return doIterate ? iterate(run(operations)) : run(operations)
}

export default function mutate(def: MapObject): Operation {
  if (Object.keys(def).length === 0) {
    return (_options) => (state) => setStateValue(state, undefined)
  }
  const flip = def.$flip || false
  const runMutation = runAndIterate(def, flip, shouldIterate(def, ''))

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
