import { compose, mergeDeepWith } from 'ramda'
import { MapDefinition, MapFunction, MapPipe, Path, State, Data } from '../types'
import { setStateValue, pipeMapFns, liftState, lowerState } from './stateHelpers'
import { set } from '../funcs/getSet'
import { rev } from '../funcs/directionals'
import pipe from '../funcs/pipe'
import { isMapObject } from './definitionHelpers'
import { mergeExisting } from './pathSetter'

const appendToPath = (path: string[], fragment: string) => [...path, fragment]

const merge = (left: Data, right: Data) => (!right) ? left : mergeDeepWith(mergeExisting, left, right)
const mergeToArray = (arr: Data[]) => (val: Data, index: number) => merge(arr[index], val)

const runAndMergeState = (fn: MapFunction) => (state: State): State => {
  const nextState = fn(lowerState(state))

  return (Array.isArray(nextState.value))
    ? setStateValue(state, (Array.isArray(state.value)) ? nextState.value.map(mergeToArray(state.value)) : nextState.value)
    : setStateValue(state, merge(state.value, nextState.value))
}

const concatToArray = (existing: MapPipe | Path | MapFunction, setFn: MapFunction) =>
  (Array.isArray(existing)) ? [...existing, setFn] : [existing, setFn]

const pipeWithSetPath = (existing: MapPipe | Path | MapFunction, pathArray: Path[]) => {
  const [path, index] = pathArray.join('.').split('/')
  const fn = runAndMergeState(pipe(concatToArray(existing, set(path))))
  return (typeof index === 'undefined') ? [fn] : [rev(fn)]
}

const extractSetFns = (def: MapDefinition, path: string[] = []): MapFunction[] => (isMapObject(def))
  ? Object.keys(def).reduce(
    (sets: MapFunction[], key: string) => [ ...sets, ...extractSetFns(def[key], appendToPath(path, key)) ],
    [])
  : (def === null) ? [] : pipeWithSetPath(def, path)

export default function objectToMapFunction (def: MapDefinition): MapFunction {
  const fns = extractSetFns(def)
  return compose(pipeMapFns(fns), liftState)
}
