/* eslint-disable security/detect-object-injection */
import type {
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
  NotOperation,
  ConcatOperation,
  LookupOperation,
  Options,
  DataMapperWithOptions,
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
import concat from '../operations/concat.js'
import lookup, { Props as LookupProps } from '../operations/lookup.js'
import pipe from '../operations/pipe.js'
import { unescapeValue } from './escape.js'
import { ensureArray } from './array.js'

const removeProp = (obj: Record<string, unknown>, prop: string) =>
  Object.fromEntries(Object.entries(obj).filter(([key]) => key !== prop))

const transformDefFromShortcut = (
  def: OperationObject | TransformObject,
  transformer: string,
  prop: string,
  overrideTransformerId?: string,
  props: Record<string, unknown> = {}
) => ({
  ...removeProp(def, `$${transformer}`),
  ...props,
  $transform: overrideTransformerId || transformer,
  [prop]: def[`$${transformer}`],
})

export const isOperationType = <T extends OperationObject>(
  def: TransformObject | OperationObject,
  prop: string
): def is T => (def as object).hasOwnProperty(prop)

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

function wrapFromDefinition(
  fn: Operation | Operation[],
  def: OperationObject
): Operation {
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

const humanizeOperatorName = (operatorProp: string) =>
  `${operatorProp[1].toUpperCase()}${operatorProp.slice(2)}`

const createOperation =
  <U extends OperationObject>(
    operationFn: (fn: DataMapperWithOptions) => Operation,
    fnProp: string,
    def: U
  ): Operation =>
  (options) =>
  (next) => {
    const { [fnProp]: fnId, ...props } = def
    if (typeof fnId !== 'string') {
      throw new Error(
        `${humanizeOperatorName(
          fnProp
        )} operator was given no transformer id or an invalid transformer id`
      )
    }

    const fn = options.transformers && options.transformers[fnId]
    if (typeof fn !== 'function') {
      throw new Error(
        `${humanizeOperatorName(
          fnProp
        )} operator was given the unknown transformer id '${fnId}'`
      )
    }

    return typeof fn === 'function'
      ? wrapFromDefinition(operationFn(fn(props)), def)(options)(next)
      : (state) => next(state)
  }

const createTransformOperation = (def: TransformOperation): Operation =>
  createOperation(transform, '$transform', def)

const createFilterOperation = (def: FilterOperation): Operation =>
  createOperation(filter, '$filter', def)

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

function createApplyOperation(
  operationFn: (pipelineId: string) => Operation,
  def: ApplyOperation
) {
  const pipelineId = def.$apply
  return wrapFromDefinition(operationFn(pipelineId), def)
}

function createPipelineOperation(
  operationFn: (...fn: TransformDefinition[]) => Operation,
  fnProp: '$concat',
  def: ConcatOperation
) {
  const pipelines = ensureArray(def[fnProp])
  return operationFn(...pipelines)
}

function createLookupOperation(
  operationFn: (props: LookupProps) => Operation,
  def: LookupOperation
) {
  const { $lookup: arrayPath, path: propPath, ...props } = def
  return wrapFromDefinition(operationFn({ ...props, arrayPath, propPath }), def)
}

function operationFromObject(def: OperationObject | TransformObject) {
  if (isOperationType<TransformOperation>(def, '$transform')) {
    return createTransformOperation(def)
  } else if (isOperationType<ValueOperation>(def, '$value')) {
    return createTransformOperation(
      transformDefFromShortcut(def, 'value', 'value')
    )
  } else if (isOperationType<FilterOperation>(def, '$filter')) {
    return createFilterOperation(def)
  } else if (isOperationType<IfOperation>(def, '$if')) {
    return createIfOperation(def)
  } else if (isOperationType<ApplyOperation>(def, '$apply')) {
    return createApplyOperation(apply, def)
  } else if (isOperationType<AltOperation>(def, '$alt')) {
    return createAltOperation(alt, def)
  } else if (isOperationType<AndOperation>(def, '$and')) {
    return createTransformOperation(
      transformDefFromShortcut(def, 'and', 'path', 'logical', {
        operator: 'AND',
      })
    )
  } else if (isOperationType<OrOperation>(def, '$or')) {
    return createTransformOperation(
      transformDefFromShortcut(def, 'or', 'path', 'logical', { operator: 'OR' })
    )
  } else if (isOperationType<NotOperation>(def, '$not')) {
    return createTransformOperation(
      transformDefFromShortcut(def, 'not', 'path')
    )
  } else if (isOperationType<ConcatOperation>(def, '$concat')) {
    return createPipelineOperation(concat, '$concat', def)
  } else if (isOperationType<LookupOperation>(def, '$lookup')) {
    return createLookupOperation(lookup, def)
  } else if (isOperationType<MergeOperation>(def, '$merge')) {
    return createTransformOperation(
      transformDefFromShortcut(def, 'merge', 'path')
    )
  } else {
    return props(def)
  }
}

export const defToOperations = (
  def?: TransformDefinition
): Operation[] | Operation =>
  Array.isArray(def)
    ? def.flatMap(defToOperations)
    : isObject(def)
    ? operationFromObject(def)
    : isPath(def)
    ? get(def)
    : isOperation(def)
    ? def
    : (_options: Options) => identity

export function defToOperation(def?: TransformDefinition): Operation {
  const operations = Array.isArray(def) ? def : defToOperations(def)
  return Array.isArray(operations) ? pipe(operations) : operations
}

export function operationToDataMapper(
  operation: Operation,
  options: Options
): DataMapper {
  const fn = operation(options)(identity)
  return (value, state) => getStateValue(fn(setStateValue(state, value)))
}

export function defToDataMapper(
  def?: TransformDefinition,
  options: Options = {}
): DataMapper {
  return operationToDataMapper(defToOperation(def), options)
}
