/* eslint-disable security/detect-object-injection */
import {
  Operation,
  DataMapper,
  TransformDefinition,
  TransformObject,
  Path,
  Pipeline,
  OperationObject,
  TransformOperation,
  FilterOperation,
  IfOperation,
  ApplyOperation,
  AltOperation,
  MergeOperation,
  ValueOperation,
  AndOperation,
  OrOperation,
  ConcatOperation,
  LookupOperation,
  Options,
} from '../types.js'
import { getStateValue, setStateValue } from './stateHelpers.js'
import { identity } from './functional.js'
import { isObject } from './is.js'
import { get } from '../operations/getSet.js'
import props from '../operations/props.js'
import iterate from '../operations/iterate.js'
import transform from '../operations/transform.js'
import filter from '../operations/filter.js'
import ifelse from '../operations/ifelse.js'
import apply from '../operations/apply.js'
import alt from '../operations/alt.js'
import { fwd, rev } from '../operations/directionals.js'
import { and, or } from '../operations/logical.js'
import concat from '../operations/concat.js'
import lookup, { Props as LookupProps } from '../operations/lookup.js'
import pipe from '../operations/pipe.js'
import { unescapeValue } from './escape.js'

export const dataMapperFromOperation =
  (operation: Operation): DataMapper =>
  (value, state) =>
    getStateValue(operation({})(identity)(setStateValue(state, value)))

const removeProp = (obj: Record<string, unknown>, prop: string) =>
  Object.fromEntries(Object.entries(obj).filter(([key]) => key !== prop))

const transformDefFromShortcut = (
  def: OperationObject | TransformObject,
  transformer: string,
  prop: string
) => ({
  ...removeProp(def, `$${transformer}`),
  $transform: transformer,
  [prop]: def[`$${transformer}`],
})

export const isOperationType = <T extends OperationObject>(
  def: TransformObject | OperationObject,
  prop: string
): def is T => def[prop] !== undefined
export const hasOperationProps = (
  def: TransformObject | OperationObject
): def is OperationObject =>
  isOperationType<TransformOperation>(def, '$transform') ||
  isOperationType<FilterOperation>(def, '$filter') ||
  isOperationType<IfOperation>(def, '$if') ||
  isOperationType<ApplyOperation>(def, '$apply') ||
  isOperationType<AltOperation>(def, '$alt') ||
  isOperationType<ValueOperation>(def, '$value') ||
  isOperationType<AndOperation>(def, '$and') ||
  isOperationType<OrOperation>(def, '$or') ||
  isOperationType<ConcatOperation>(def, '$concat') ||
  isOperationType<LookupOperation>(def, '$lookup')

export const isPath = (def: unknown): def is Path => typeof def === 'string'
export const isTransformObject = (def: unknown): def is TransformObject =>
  isObject(def) && !hasOperationProps(def as TransformObject | OperationObject)
export const isPipeline = (def: unknown): def is Pipeline => Array.isArray(def)
export const isOperation = (def: unknown): def is Operation =>
  typeof def === 'function'
export const isTransformDefinition = (
  def: unknown
): def is TransformDefinition =>
  isPath(def) || isObject(def) || isPipeline(def) || isOperation(def)

const iterateIf = (fn: Operation | Operation[], should: boolean) =>
  should ? iterate(fn) : fn

const wrapFromDefinition = (
  fn: Operation | Operation[],
  def: OperationObject
): Operation => {
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
    return Array.isArray(fnIterated)
      ? pipe(fnIterated)(options)(next)
      : fnIterated(options)(next)
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
    const { [fnProp]: fnId, ...props } = def
    const fn = options.transformers && options.transformers[fnId as string]
    return typeof fn === 'function'
      ? wrapFromDefinition(operationFn(fn(props, options)), def)(options)(next)
      : (state) => next(state)
  }

const setNoneValuesOnOptions = (options: Options, nonvalues?: unknown[]) =>
  Array.isArray(nonvalues)
    ? { ...options, nonvalues: nonvalues.map(unescapeValue) }
    : options

const createAltOperation =
  (
    operationFn: (...defs: TransformDefinition[]) => Operation[],
    def: AltOperation
  ): Operation | Operation[] =>
  (options) =>
  (next) => {
    const { $alt: defs, $undefined: nonvalues } = def
    return Array.isArray(defs)
      ? wrapFromDefinition(
          operationFn(...defs),
          def
        )(setNoneValuesOnOptions(options, nonvalues))(next)
      : (state) => next(state)
  }

const createIfOperation =
  (def: IfOperation): Operation =>
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
  def: ApplyOperation
) => {
  const pipelineId = def.$apply
  return wrapFromDefinition(operationFn(pipelineId), def)
}

const createPipelineOperation = (
  operationFn: (...fn: TransformDefinition[]) => Operation,
  fnProp: '$and' | '$or' | '$concat',
  def: AndOperation | OrOperation | ConcatOperation
) => {
  const pipelines = def[fnProp] as TransformDefinition[] // TODO: Do more validation checks here?
  return operationFn(...pipelines)
}

const createLookupOperation = (
  operationFn: (props: LookupProps) => Operation,
  def: LookupOperation
) => {
  const { $lookup: arrayPath, path: propPath, ...props } = def
  return wrapFromDefinition(operationFn({ ...props, arrayPath, propPath }), def)
}

const operationFromObject = (def: OperationObject | TransformObject) => {
  if (isOperationType<TransformOperation>(def, '$transform')) {
    return createOperation(transform, '$transform', def)
  } else if (isOperationType<ValueOperation>(def, '$value')) {
    return createOperation(
      transform,
      '$transform',
      transformDefFromShortcut(def, 'value', 'value')
    )
  } else if (isOperationType<FilterOperation>(def, '$filter')) {
    return createOperation(filter, '$filter', def)
  } else if (isOperationType<IfOperation>(def, '$if')) {
    return createIfOperation(def)
  } else if (isOperationType<ApplyOperation>(def, '$apply')) {
    return createApplyOperation(apply, def)
  } else if (isOperationType<AltOperation>(def, '$alt')) {
    return createAltOperation(alt, def)
  } else if (isOperationType<AndOperation>(def, '$and')) {
    return createPipelineOperation(and, '$and', def)
  } else if (isOperationType<OrOperation>(def, '$or')) {
    return createPipelineOperation(or, '$or', def)
  } else if (isOperationType<ConcatOperation>(def, '$concat')) {
    return createPipelineOperation(concat, '$concat', def)
  } else if (isOperationType<LookupOperation>(def, '$lookup')) {
    return createLookupOperation(lookup, def)
  } else if (isOperationType<MergeOperation>(def, '$merge')) {
    return createOperation(
      transform,
      '$transform',
      transformDefFromShortcut(def, 'merge', 'path')
    )
  } else {
    return props(def)
  }
}

export const operationsFromDef = (
  def?: TransformDefinition
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

export function operationFromDef(def?: TransformDefinition): Operation {
  const operations = Array.isArray(def) ? def : operationsFromDef(def)
  return Array.isArray(operations) ? pipe(operations) : operations
}

export const defsToDataMapper = (def?: TransformDefinition): DataMapper =>
  dataMapperFromOperation(operationFromDef(def))
