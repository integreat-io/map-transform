import { identity } from 'ramda'
import {
  Operation,
  StateMapper,
  Data,
  DataMapper,
  MapDefinition,
  MapObject,
  Path,
  MapPipe,
  OperationObject,
  TransformObject,
  FilterObject,
  Options,
  CustomFunctions
} from '../types'
import { get } from '../operations/getSet'
import mutate from '../operations/mutate'
import pipe from '../operations/pipe'
import transform from '../operations/transform'
import filter from '../operations/filter'

const isObject = (def: MapDefinition): def is MapObject | OperationObject =>
  typeof def === 'object' && def !== null && !Array.isArray(def)

export const hasTransformProp = (
  def: MapObject | OperationObject
): def is TransformObject => typeof def['$transform'] !== 'undefined'
export const hasFilterProp = (
  def: MapObject | OperationObject
): def is FilterObject => typeof def['$filter'] !== 'undefined'
export const hasOperationProps = (
  def: MapObject | OperationObject
): def is OperationObject => hasTransformProp(def) || hasFilterProp(def)

export const isPath = (def: any): def is Path => typeof def === 'string'
export const isMapObject = (def: any): def is MapObject =>
  isObject(def) && !hasOperationProps(def)
export const isMapPipe = (def: any): def is MapPipe => Array.isArray(def)
export const isOperation = (def: any): def is Operation =>
  typeof def === 'function'

const getOperationFunction = (
  fnId?: string,
  customFunctions?: CustomFunctions
) =>
  fnId &&
  customFunctions &&
  (typeof customFunctions[fnId] as any) === 'function'
    ? customFunctions[fnId]
    : undefined

const createOperation = <T>(
  operationFn: (fn: DataMapper<Data, T>) => Operation,
  fnId: string | undefined,
  { $transform: transformFn, $filter: filterFn, ...operands }: OperationObject,
  options: Options
) => {
  const fn = getOperationFunction(fnId, options.customFunctions)
  return typeof fn !== 'undefined'
    ? operationFn(fn(operands) as any)(options)
    : identity // TODO: Improve typing
}

const operationFromObject = (
  def: OperationObject | MapObject,
  options: Options
) => {
  if (hasTransformProp(def)) {
    return createOperation(transform, def['$transform'], def, options)
  } else if (hasFilterProp(def)) {
    return createOperation(filter, def['$filter'], def, options)
  } else {
    return mutate(def)(options)
  }
}

export const mapFunctionFromDef = (
  def: MapDefinition,
  options: Options
): StateMapper =>
  isMapPipe(def)
    ? pipe(def)(options)
    : isObject(def)
    ? operationFromObject(def, options)
    : isPath(def)
    ? get(def)(options)
    : isOperation(def)
    ? def(options)
    : identity
