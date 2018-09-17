import { compose, mergeDeepRight } from 'ramda'
import { MapDefinition, MapFunction, MapPipe, Path, State, Data } from '../types'
import { setStateValue, pipeMapFns, liftState, lowerState } from './stateHelpers'
import { set } from '../funcs/getSet'
import pipe from '../funcs/pipe'
import { isMapObject } from './definitionHelpers'

const appendToPath = (path: string[], fragment: string) => [...path, fragment]

const mergeToArray = (arr: Data[]) => (val: Data, index: number) => mergeDeepRight(arr[index], val)

const runAndMergeState = (fn: MapFunction) => (state: State): State => {
  const nextState = fn(lowerState(state))

  return (Array.isArray(nextState.value))
    ? setStateValue(state, (Array.isArray(state.value)) ? nextState.value.map(mergeToArray(state.value)) : nextState.value)
    : setStateValue(state, mergeDeepRight(state.value, nextState.value))
}

const concatToArray = (existing: MapPipe | Path | MapFunction, setFn: MapFunction) =>
  (Array.isArray(existing)) ? [...existing, setFn] : [existing, setFn]

const pipeWithSetPath = (existing: MapPipe | Path | MapFunction, setFn: MapFunction) =>
  runAndMergeState(pipe(concatToArray(existing, setFn)))

const extractSetFns = (def: MapDefinition, path: string[] = []): MapFunction[] => (isMapObject(def))
  ? Object.keys(def).reduce(
    (sets: MapFunction[], key: string) => [ ...sets, ...extractSetFns(def[key], appendToPath(path, key)) ],
    [])
  : (def === null) ? [] : [pipeWithSetPath(def, set(path.join('.')))]

export default function objectToMapFunction (def: MapDefinition): MapFunction {
  const fns = extractSetFns(def)
  return compose(pipeMapFns(fns), liftState)
}
