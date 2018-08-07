import { identity } from 'ramda'
import { MapFunction, MapDefinition, MapObject, Path, MapPipe } from '../types'
import get from '../funcs/get'
import mutate from '../funcs/mutate'
import pipe from '../funcs/pipe'

export const isPath = (def: MapDefinition): def is Path => typeof def === 'string'
export const isMapObject = (def: MapDefinition): def is MapObject => def !== null && typeof def === 'object' && !isMapPipe(def)
export const isMapPipe = (def: MapDefinition): def is MapPipe => Array.isArray(def)

export const mapFunctionFromDef = (def: MapDefinition): MapFunction =>
  (def === null) ? identity
    : isPath(def) ? get(def)
    : isMapObject(def) ? mutate(def)
    : isMapPipe(def) ? pipe(def)
    : def
