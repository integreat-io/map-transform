import { identity, isNil } from 'ramda'
import { MapFunction, MapDefinition, MapObject, Path, MapPipe } from '../types'
import { get } from '../funcs/getSet'
import mutate from '../funcs/mutate'
import pipe from '../funcs/pipe'

export const isPath = (def: MapDefinition): def is Path => typeof def === 'string'
export const isMapObject = (def: MapDefinition): def is MapObject => def !== null && typeof def === 'object' && !isMapPipe(def)
export const isMapPipe = (def: MapDefinition): def is MapPipe => Array.isArray(def)

export const mapFunctionFromDef = (def: MapDefinition): MapFunction =>
  (isNil(def)) ? identity
    : isMapObject(def) ? mutate(def)
    : isPath(def) ? get(def)
    : isMapPipe(def) ? pipe(def)
    : def
