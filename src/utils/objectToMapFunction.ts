import { compose } from 'ramda'
import {
  MapDefinition,
  MapObject,
  Operation,
  StateMapper,
  MapPipe,
  Path,
  State,
  OperationObject,
  Options
} from '../types'
import {
  setStateValue,
  pipeMapFns,
  liftState,
  lowerState
} from './stateHelpers'
import { set } from '../operations/getSet'
import { rev } from '../operations/directionals'
import pipe from '../operations/pipe'
import { isMapObject } from './definitionHelpers'
import { merge } from './pathSetter'

const appendToPath = (path: string[], fragment: string) => [...path, fragment]

const runAndMergeState = (fn: Operation) => (options: Options) => (
  state: State
): State => {
  const nextState = fn(options)(lowerState(state))
  return setStateValue(state, merge(state.value, nextState.value))
}

const concatToArray = (
  existing: MapPipe | Path | Operation | OperationObject,
  setFn: Operation
) => (Array.isArray(existing) ? [...existing, setFn] : [existing, setFn])

function pipeWithSetPath(
  existing: MapPipe | Path | Operation | OperationObject,
  options: Options,
  pathArray: Path[]
): StateMapper[] {
  const [path, index] = pathArray.join('.').split('/')
  const fn = runAndMergeState(pipe(concatToArray(existing, set(path))))
  return index === undefined ? [fn(options)] : [rev(fn)(options)]
}

const extractSetFns = (
  def: MapDefinition | undefined,
  options: Options,
  path: string[] = []
): StateMapper[] =>
  isMapObject(def)
    ? Object.keys(def).reduce(
        (sets: StateMapper[], key: string) => [
          ...sets,
          ...extractSetFns(def[key], options, appendToPath(path, key))
        ],
        []
      )
    : def === null || def === undefined
    ? []
    : pipeWithSetPath(def, options, path)

export default function objectToMapFunction(def: MapObject, options: Options) {
  const fns = extractSetFns(def, options)
  return compose(pipeMapFns(fns), liftState)
}
