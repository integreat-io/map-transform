import { identity, isNil } from 'ramda'
import { MapFunction, MapDefinition, MapObject, Path, MapPipe, Operation } from '../types'
import { get } from '../funcs/getSet'
import mutate from '../funcs/mutate'
import pipe from '../funcs/pipe'
import operation from '../funcs/operation'

const isObject = (def: MapDefinition): def is { [key: string]: any } =>
  typeof def === 'object' && def !== null && !Array.isArray(def)

export const isPath = (def: any): def is Path => typeof def === 'string'
export const isMapObject = (def: any): def is MapObject => isObject(def) && typeof def['$op'] === 'undefined'
export const isMapPipe = (def: any): def is MapPipe => Array.isArray(def)
export const isOperation = (def: any): def is Operation => isObject(def) && typeof def['$op'] === 'string'

export const mapFunctionFromDef = (def: MapDefinition): MapFunction =>
  (isNil(def)) ? identity
    : isMapPipe(def) ? pipe(def)
    : isOperation(def) ? operation(def)
    : isMapObject(def) ? mutate(def)
    : isPath(def) ? get(def)
    : def
