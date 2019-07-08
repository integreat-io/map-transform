import { identity } from 'ramda'
import {
  Operation,
  StateMapper,
  DataMapper,
  MapDefinition,
  MapObject,
  Path,
  MapPipe,
  OperationObject,
  TransformObject,
  FilterObject,
  ApplyObject,
  AltObject,
  Options
} from '../types'
import { get } from '../operations/getSet'
import mutate from '../operations/mutate'
import pipe from '../operations/pipe'
import transform from '../operations/transform'
import filter from '../operations/filter'
import apply from '../operations/apply'
import alt from '../operations/alt'

const isObject = (def: MapDefinition): def is MapObject | OperationObject =>
  typeof def === 'object' && def !== null && !Array.isArray(def)

export const isOperationType = <T extends OperationObject>(
  def: MapObject | OperationObject,
  prop: string
): def is T => typeof def[prop] !== 'undefined'
export const hasOperationProps = (
  def: MapObject | OperationObject
): def is OperationObject =>
  isOperationType<TransformObject>(def, '$transform') ||
  isOperationType<FilterObject>(def, '$filter') ||
  isOperationType<ApplyObject>(def, '$apply') ||
  isOperationType<AltObject>(def, '$alt')

export const isPath = (def: any): def is Path => typeof def === 'string'
export const isMapObject = (def: any): def is MapObject =>
  isObject(def) && !hasOperationProps(def)
export const isMapPipe = (def: any): def is MapPipe => Array.isArray(def)
export const isOperation = (def: any): def is Operation =>
  typeof def === 'function'

const createOperation = <U extends OperationObject>(
  operationFn: (fn: DataMapper) => Operation,
  fnProp: string,
  operation: U,
  options: Options
) => {
  const { [fnProp]: fnId, ...operands } = operation
  const fn = options.functions![fnId as string]
  return typeof fn === 'function'
    ? operationFn(fn(operands))(options)
    : identity
}

const createApplyOperation = (
  operationFn: (pipelineId: string) => Operation,
  operation: ApplyObject,
  options: Options
) => {
  const pipelineId = operation.$apply
  return operationFn(pipelineId)(options)
}

const operationFromObject = (
  def: OperationObject | MapObject,
  options: Options
) => {
  if (isOperationType<TransformObject>(def, '$transform')) {
    return createOperation(transform, '$transform', def, options)
  } else if (isOperationType<FilterObject>(def, '$filter')) {
    return createOperation(filter, '$filter', def, options)
  } else if (isOperationType<ApplyObject>(def, '$apply')) {
    return createApplyOperation(apply, def, options)
  } else if (isOperationType<AltObject>(def, '$alt')) {
    return createOperation(alt, '$alt', def, options)
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
