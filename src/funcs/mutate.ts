import { compose, mergeDeepRight } from 'ramda'
import { MapFunction, State, MapDefinition, MapPipe, Path } from '../types'
import { set } from './getSet'
import pipe from './pipe'
import { setValueFromState, setValue, getValue, liftState, pipeMapFns } from '../utils/stateHelpers'
import { isMapObject } from '../utils/definitionHelpers'

const appendToPath = (path: string[], fragment: string) => [...path, fragment]

const runAndMergeState = (fn: MapFunction) => (state: State): State => {
  const run = compose(getValue, fn, setValue(state))
  const value = run(state.context)

  return (Array.isArray(value))
    ? setValue(state, value)
    : setValue(state, mergeDeepRight(state.value, value))
}

const mergeWithPath = (existing: MapPipe | Path | MapFunction, path: Path) =>
  (Array.isArray(existing)) ? [...existing, set(path)] : [existing, set(path)]

const pipeWithSetPath = (existing: MapPipe | Path | MapFunction, path: Path) =>
  runAndMergeState(pipe(mergeWithPath(existing, path)))

const extractSetFns = (def: MapDefinition, path: string[] = []): MapFunction[] => (isMapObject(def))
  ? Object.keys(def).reduce(
    (sets: MapFunction[], key: string) => [ ...sets, ...extractSetFns(def[key], appendToPath(path, key)) ],
    [])
  : (def === null) ? [] : [pipeWithSetPath(def, path.join('.'))]

export default function mutate (def: MapDefinition): MapFunction {
  const fns = extractSetFns(def)
  const runMutation = compose(pipeMapFns(fns), liftState)

  return (state: State): State => setValueFromState(
    state,
    runMutation(state)
  )
}
