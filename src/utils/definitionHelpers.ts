import { identity } from 'ramda'
import {
  Operation,
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
import iterate from '../operations/iterate'
import pipe from '../operations/pipe'
import transform from '../operations/transform'
import filter from '../operations/filter'
import apply from '../operations/apply'
import alt from '../operations/alt'
import { fwd, rev } from '../operations/directionals'

const altOperation = (fn: DataMapper) => alt(transform(fn))

const isObject = (def: unknown): def is MapObject | OperationObject =>
  typeof def === 'object' && def !== null && !Array.isArray(def)

export const isOperationType = <T extends OperationObject>(
  def: MapObject | OperationObject,
  prop: string
): def is T => typeof def[prop] !== 'undefined' // eslint-disable-line security/detect-object-injection
export const hasOperationProps = (
  def: MapObject | OperationObject
): def is OperationObject =>
  isOperationType<TransformObject>(def, '$transform') ||
  isOperationType<FilterObject>(def, '$filter') ||
  isOperationType<ApplyObject>(def, '$apply') ||
  isOperationType<AltObject>(def, '$alt')

export const isPath = (def: unknown): def is Path => typeof def === 'string'
export const isMapObject = (def: unknown): def is MapObject =>
  isObject(def) && !hasOperationProps(def)
export const isMapPipe = (def: unknown): def is MapPipe => Array.isArray(def)
export const isOperation = (def: unknown): def is Operation =>
  typeof def === 'function'

const iterateIf = (fn: Operation, should: boolean) =>
  should ? iterate(fn) : fn

const wrapFromDefinition = (fn: Operation, def: OperationObject) => {
  const fnIterated = iterateIf(fn, def.$iterate === true)
  return def.$direction === 'rev'
    ? rev(fnIterated)
    : def.$direction === 'fwd'
    ? fwd(fnIterated)
    : fnIterated
}

const createOperation = <U extends OperationObject>(
  operationFn: (fn: DataMapper) => Operation,
  fnProp: string,
  def: U
) => (options: Options) => {
  const { [fnProp]: fnId, ...operands } = def
  const fn = options.functions && options.functions[fnId as string]
  return typeof fn === 'function'
    ? wrapFromDefinition(operationFn(fn(operands, options)), def)(options)
    : identity
}

const createApplyOperation = (
  operationFn: (pipelineId: string) => Operation,
  def: ApplyObject
) => {
  const pipelineId = def.$apply
  return wrapFromDefinition(operationFn(pipelineId), def)
}

const operationFromObject = (def: OperationObject | MapObject) => {
  if (isOperationType<TransformObject>(def, '$transform')) {
    return createOperation(transform, '$transform', def)
  } else if (isOperationType<FilterObject>(def, '$filter')) {
    return createOperation(filter, '$filter', def)
  } else if (isOperationType<ApplyObject>(def, '$apply')) {
    return createApplyOperation(apply, def)
  } else if (isOperationType<AltObject>(def, '$alt')) {
    return createOperation(altOperation, '$alt', def)
  } else {
    return mutate(def)
  }
}

export const mapFunctionFromDef = (def?: MapDefinition): Operation =>
  isMapPipe(def)
    ? pipe(def)
    : isObject(def)
    ? operationFromObject(def)
    : isPath(def)
    ? get(def)
    : isOperation(def)
    ? def
    : (_options: Options) => identity
