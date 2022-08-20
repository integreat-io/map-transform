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
  IfObject,
  ApplyObject,
  AltObject,
  ValueObject,
  AndObject,
  OrObject,
  ConcatObject,
  LookupObject,
  Options,
} from '../types'
import { identity } from './functional'
import { isObject } from './is'
import { get } from '../operations/getSet'
import props from '../operations/props'
import iterate from '../operations/iterate'
// import pipe from '../operations/pipe'
import transform from '../operations/transform'
import filter from '../operations/filter'
import ifelse from '../operations/ifelse'
import apply from '../operations/apply'
import alt from '../operations/alt'
import { fwd, rev } from '../operations/directionals'
import { and, or } from '../operations/logical'
import concat from '../operations/concat'
import lookup from '../operations/lookup'
import pipe from '../operations/pipe'

const transformDefFromValue = ({
  $value: value,
  ...def
}: OperationObject | MapObject) => ({
  ...def,
  $transform: 'value',
  value,
})

export const isOperationType = <T extends OperationObject>(
  def: MapObject | OperationObject,
  prop: string
): def is T => def[prop] !== undefined // eslint-disable-line security/detect-object-injection
export const hasOperationProps = (
  def: MapObject | OperationObject
): def is OperationObject =>
  isOperationType<TransformObject>(def, '$transform') ||
  isOperationType<FilterObject>(def, '$filter') ||
  isOperationType<IfObject>(def, '$if') ||
  isOperationType<ApplyObject>(def, '$apply') ||
  isOperationType<AltObject>(def, '$alt') ||
  isOperationType<ValueObject>(def, '$value') ||
  isOperationType<AndObject>(def, '$and') ||
  isOperationType<OrObject>(def, '$or') ||
  isOperationType<ConcatObject>(def, '$concat') ||
  isOperationType<LookupObject>(def, '$lookup')

export const isPath = (def: unknown): def is Path => typeof def === 'string'
export const isMapObject = (def: unknown): def is MapObject =>
  isObject(def) && !hasOperationProps(def as MapObject | OperationObject)
export const isMapPipe = (def: unknown): def is MapPipe => Array.isArray(def)
export const isOperation = (def: unknown): def is Operation =>
  typeof def === 'function'
export const isMapDefinition = (def: unknown): def is MapDefinition =>
  isPath(def) || isObject(def) || isMapPipe(def) || isOperation(def)

const iterateIf = (fn: Operation, should: boolean) =>
  should ? iterate(fn) : fn

const wrapFromDefinition = (fn: Operation, def: OperationObject): Operation => {
  const fnIterated = iterateIf(fn, def.$iterate === true)
  return (options) => (next) => {
    const dir = def.$direction
    if (typeof dir === 'string') {
      if (dir === 'rev' || dir === options.revAlias) {
        return rev(fnIterated)(options)(next)
      } else if (dir === 'fwd' || dir === options.fwdAlias) {
        return fwd(fnIterated)(options)(next)
      }
    }
    return fnIterated(options)(next)
  }
}

const createOperation =
  <U extends OperationObject>(
    operationFn: (fn: DataMapper) => Operation,
    fnProp: string,
    def: U
  ): Operation =>
  (options) =>
  (next) => {
    const { [fnProp]: fnId, ...operands } = def
    const fn = options.functions && options.functions[fnId as string]
    return typeof fn === 'function'
      ? wrapFromDefinition(operationFn(fn(operands, options)), def)(options)(
          next
        )
      : (state) => next(state)
  }

const createAltOperation =
  (
    operationFn: (fn: MapDefinition, _def?: unknown[]) => Operation,
    def: AltObject
  ): Operation =>
  (options) =>
  (next) => {
    const { $alt: fnId, $undefined: undefinedValues, ...operands } = def
    const fn = options.functions && options.functions[fnId as string]
    return typeof fn === 'function'
      ? wrapFromDefinition(
          operationFn(transform(fn(operands, options)), undefinedValues),
          def
        )(options)(next)
      : (state) => next(state)
  }

const createIfOperation =
  (def: IfObject): Operation =>
  (options) =>
  (next) => {
    const {
      $if: conditionPipeline,
      then: thenPipeline,
      else: elsePipeline,
    } = def
    return wrapFromDefinition(
      ifelse(conditionPipeline, thenPipeline, elsePipeline),
      def
    )(options)(next)
  }

const createApplyOperation = (
  operationFn: (pipelineId: string) => Operation,
  def: ApplyObject
) => {
  const pipelineId = def.$apply
  return wrapFromDefinition(operationFn(pipelineId), def)
}

const createPipelineOperation = (
  operationFn: (...fn: MapDefinition[]) => Operation,
  fnProp: '$and' | '$or' | '$concat',
  def: AndObject | OrObject | ConcatObject
) => {
  const pipelines = def[fnProp] // eslint-disable-line security/detect-object-injection
  return operationFn(...pipelines)
}

const createLookupOperation = (
  operationFn: (arrayPath: Path, propPath: Path) => Operation,
  def: LookupObject
) => {
  const arrayPath = def.$lookup
  const propPath = def.path
  return wrapFromDefinition(operationFn(arrayPath, propPath), def)
}

const operationFromObject = (def: OperationObject | MapObject) => {
  if (isOperationType<TransformObject>(def, '$transform')) {
    return createOperation(transform, '$transform', def)
  } else if (isOperationType<ValueObject>(def, '$value')) {
    return createOperation(transform, '$transform', transformDefFromValue(def))
  } else if (isOperationType<FilterObject>(def, '$filter')) {
    return createOperation(filter, '$filter', def)
  } else if (isOperationType<IfObject>(def, '$if')) {
    return createIfOperation(def)
  } else if (isOperationType<ApplyObject>(def, '$apply')) {
    return createApplyOperation(apply, def)
  } else if (isOperationType<AltObject>(def, '$alt')) {
    return createAltOperation(alt, def)
  } else if (isOperationType<AndObject>(def, '$and')) {
    return createPipelineOperation(and, '$and', def)
  } else if (isOperationType<OrObject>(def, '$or')) {
    return createPipelineOperation(or, '$or', def)
  } else if (isOperationType<ConcatObject>(def, '$concat')) {
    return createPipelineOperation(concat, '$concat', def)
  } else if (isOperationType<LookupObject>(def, '$lookup')) {
    return createLookupOperation(lookup, def)
  } else {
    return props(def)
  }
}

export const operationsFromDef = (
  def?: MapDefinition
): Operation[] | Operation =>
  Array.isArray(def)
    ? def.flatMap(operationsFromDef)
    : isObject(def)
    ? operationFromObject(def)
    : isPath(def)
    ? get(def)
    : isOperation(def)
    ? def
    : (_options: Options) => identity

export function operationFromDef(def?: MapDefinition): Operation {
  const operations = operationsFromDef(def)
  return Array.isArray(operations) ? pipe(operations) : operations
}
