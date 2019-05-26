import { compose, mergeDeepWith } from 'ramda'
import { MapDefinition, MapObject, Operation, StateMapper, MapPipe, Path, State, Data, OperationObject, Options } from '../types'
import { setStateValue, pipeMapFns, liftState, lowerState } from './stateHelpers'
import { set } from '../operations/getSet'
import { rev } from '../operations/directionals'
import pipe from '../operations/pipe'
import { isMapObject } from './definitionHelpers'
import { mergeExisting } from './pathSetter'

const appendToPath = (path: string[], fragment: string) => [...path, fragment]

const merge = (left: Data, right: Data) => (!right) ? left : mergeDeepWith(mergeExisting, left, right)
const mergeToArray = (arr: Data[]) => (val: Data, index: number) => merge(arr[index], val)

const runAndMergeState = (fn: Operation) => (options: Options) => (state: State): State => {
  const nextState = fn(options)(lowerState(state))

  return (Array.isArray(nextState.value))
    ? setStateValue(state, (Array.isArray(state.value)) ? nextState.value.map(mergeToArray(state.value)) : nextState.value)
    : setStateValue(state, merge(state.value, nextState.value))
}

const concatToArray = (existing: MapPipe | Path | Operation | OperationObject, setFn: Operation) =>
  (Array.isArray(existing)) ? [...existing, setFn] : [existing, setFn]

const pipeWithSetPath = (existing: MapPipe | Path | Operation | OperationObject, options: Options, pathArray: Path[]): StateMapper[] => {
  const [path, index] = pathArray.join('.').split('/')
  const fn = runAndMergeState(pipe(concatToArray(existing, set(path))))
  return (typeof index === 'undefined') ? [fn(options)] : [rev(fn)(options)]
}

const extractSetFns = (def: MapDefinition | undefined, options: Options, path: string[] = []): StateMapper[] => (isMapObject(def))
  ? Object.keys(def).reduce(
    (sets: StateMapper[], key: string) => [ ...sets, ...extractSetFns(def[key], options, appendToPath(path, key)) ],
    [])
  : (def === null || typeof def === 'undefined')
    ? [] : pipeWithSetPath(def, options, path)

export default function objectToMapFunction (def: MapObject, options: Options) {
  const fns = extractSetFns(def, options)
  return compose(pipeMapFns(fns), liftState)
}
