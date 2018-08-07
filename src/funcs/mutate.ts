import { MapFunction, State, MapDefinition, Path } from '../types'
import set from './set'
import { setValueFromState, shiftState, pipeMapFns } from '../utils/stateHelpers'
import { mapFunctionFromDef, isMapObject } from '../utils/definitionHelpers'

const appendToPath = (path: string[], fragment: string) => [...path, fragment]

const extractSetFns = (def: MapDefinition, path: string[] = []): MapFunction[] => (isMapObject(def))
  ? Object.keys(def).reduce(
    (sets: MapFunction[], key: string) => [ ...sets, ...extractSetFns(def[key], appendToPath(path, key)) ],
    [])
  : (def !== null)
    ? [set(path.join('.'), mapFunctionFromDef(def as Path | MapFunction))]
    : []

export default function mutate (def: MapDefinition): MapFunction {
  const runMutation = pipeMapFns(extractSetFns(def))

  return (state: State): State => setValueFromState(
    state,
    runMutation(shiftState(state))
  )
}
