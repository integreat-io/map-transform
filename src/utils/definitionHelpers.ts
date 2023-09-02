import { getStateValue, setStateValue } from './stateHelpers.js'
import modifyOperationObject from './modifyOperationObject.js'
import { noopNext } from '../utils/stateHelpers.js'
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
import { concat } from '../operations/concat.js'
import { lookup, Props as LookupProps } from '../operations/lookup.js'
import pipe from '../operations/pipe.js'
import { unescapeValue } from './escape.js'
import { ensureArray } from './array.js'
import type {
  Operation,
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
  ConcatOperation,
  LookupOperation,
  Options,
  DataMapperWithState,
  DataMapperWithOptions,
  AsyncDataMapperWithOptions,
  State,
  StateMapper,
  AsyncDataMapperWithState,
} from '../types.js'

const passStateThroughNext = (next: StateMapper) => async (state: State) =>
  next(state)

const nonOperatorKeys = [
  '$iterate',
  '$modify',
  '$noDefaults',
  '$flip',
  '$direction',
]

const isOperatorKey = (key: string) =>
  key[0] === '$' && !nonOperatorKeys.includes(key)

const isOperationObject = (def: unknown): def is OperationObject =>
  isObject(def) && Object.keys(def).filter(isOperatorKey).length > 0

export const isOperationType = <T extends OperationObject>(
  def: TransformObject | OperationObject,
  prop: string
): def is T => (def as object).hasOwnProperty(prop)

const pipeIfArray = (
  operations: Operation | Operation[] | Pipeline
): Operation => (Array.isArray(operations) ? pipe(operations) : operations)

export const isPath = (def: unknown): def is Path => typeof def === 'string'
export const isTransformObject = (def: unknown): def is TransformObject =>
  isObject(def) && !isOperationObject(def)
export const isPipeline = (def: unknown): def is Pipeline => Array.isArray(def)
export const isOperation = (def: unknown): def is Operation =>
  typeof def === 'function'
export const isTransformDefinition = (
  def: unknown
): def is TransformDefinition =>
  isPath(def) || isObject(def) || isPipeline(def) || isOperation(def)

const wrapInNoDefaults =
  (fn: Operation): Operation =>
  (options) =>
  (next) => {
    const stateMapper = fn(options)(next)
    return async (state: State) => {
      const stateWithNoDefaults = { ...state, noDefaults: true }
      return stateMapper(stateWithNoDefaults)
    }
  }

function wrapFromDefinition(
  ops: Operation | Operation[],
  def: OperationObject
): Operation {
  const opsWithNoDefaults =
    def.$noDefaults === true ? wrapInNoDefaults(pipeIfArray(ops)) : ops
  const fn =
    def.$iterate === true ? iterate(opsWithNoDefaults) : opsWithNoDefaults
  return (options) => {
    const dir = def.$direction
    if (typeof dir === 'string') {
      if (dir === 'rev' || dir === options.revAlias) {
        return rev(fn)(options)
      } else if (dir === 'fwd' || dir === options.fwdAlias) {
        return fwd(fn)(options)
      }
    }
    return Array.isArray(fn) ? pipe(fn, true)(options) : fn(options)
  }
}

const humanizeOperatorName = (operatorProp: string) =>
  `${operatorProp[1].toUpperCase()}${operatorProp.slice(2)}`

const createOperation =
  <U extends OperationObject>(
    operationFn: (
      fn: DataMapperWithOptions | AsyncDataMapperWithOptions
    ) => Operation,
    fnProp: string,
    def: U
  ): Operation =>
  (options) => {
    const { [fnProp]: fnId, ...props } = def
    if (typeof fnId !== 'string' && typeof fnId !== 'symbol') {
      throw new Error(
        `${humanizeOperatorName(
          fnProp
        )} operator was given no transformer id or an invalid transformer id`
      )
    }

    // eslint-disable-next-line security/detect-object-injection
    const fn = options.transformers && options.transformers[fnId]
    if (typeof fn !== 'function') {
      throw new Error(
        `${humanizeOperatorName(
          fnProp
        )} operator was given the unknown transformer id '${String(fnId)}'`
      )
    }

    return typeof fn === 'function'
      ? wrapFromDefinition(operationFn(fn(props)), def)(options)
      : passStateThroughNext
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
  (options) => {
    const { $alt: defs, $undefined: nonvalues } = def
    return Array.isArray(defs)
      ? wrapFromDefinition(
          operationFn(...defs),
          def
        )(setNoneValuesOnOptions(options, nonvalues))
      : passStateThroughNext
  }

const createIfOperation =
  (def: IfOperation): Operation =>
  (options) => {
    const {
      $if: conditionPipeline,
      then: thenPipeline,
      else: elsePipeline,
    } = def
    return wrapFromDefinition(
      ifelse(conditionPipeline, thenPipeline, elsePipeline),
      def
    )(options)
  }

function createApplyOperation(
  operationFn: (pipelineId: string | symbol) => Operation,
  def: ApplyOperation
) {
  const pipelineId = def.$apply
  return wrapFromDefinition(operationFn(pipelineId), def)
}

function createPipelineOperation(
  operationFn: (...fn: TransformDefinition[]) => Operation,
  def: ConcatOperation
) {
  const pipelines = ensureArray(def.$concat)
  return operationFn(...pipelines)
}

function createLookupOperation(
  operationFn: (props: LookupProps) => Operation,
  def: LookupOperation
) {
  const { $lookup: arrayPath, path: propPath, ...props } = def
  return wrapFromDefinition(operationFn({ ...props, arrayPath, propPath }), def)
}

function operationFromObject(
  defRaw: OperationObject | TransformObject,
  options: Options
): Operation | Operation[] {
  const def = modifyOperationObject(defRaw, options.modifyOperationObject)

  if (isOperationObject(def)) {
    if (isOperationType<TransformOperation>(def, '$transform')) {
      return createTransformOperation(def)
    } else if (isOperationType<FilterOperation>(def, '$filter')) {
      return createFilterOperation(def)
    } else if (isOperationType<IfOperation>(def, '$if')) {
      return createIfOperation(def)
    } else if (isOperationType<ApplyOperation>(def, '$apply')) {
      return createApplyOperation(apply, def)
    } else if (isOperationType<AltOperation>(def, '$alt')) {
      return createAltOperation(alt, def)
    } else if (isOperationType<ConcatOperation>(def, '$concat')) {
      return createPipelineOperation(concat, def)
    } else if (isOperationType<LookupOperation>(def, '$lookup')) {
      return createLookupOperation(lookup, def)
    } else {
      // Not a known operation
      return () => () => async (value) => value
    }
  } else {
    return props(def as TransformObject)
  }
}

export const defToOperations = (
  def: TransformDefinition | undefined,
  options: Options
): Operation[] | Operation =>
  isPipeline(def)
    ? def.flatMap((def) => defToOperations(def, options))
    : isObject(def)
    ? operationFromObject(def, options)
    : isPath(def)
    ? get(def)
    : isOperation(def)
    ? def
    : () => () => async (value) => value

export function defToOperation(
  def: TransformDefinition | undefined,
  options: Options
): Operation {
  const operations = isPipeline(def) ? def : defToOperations(def, options)
  return pipeIfArray(operations)
}

export function operationToDataMapper(
  operation: Operation,
  options: Options
): DataMapperWithState | AsyncDataMapperWithState {
  const fn = operation(options)(noopNext)
  return async (value, state) =>
    getStateValue(await fn(setStateValue(state, value)))
}

export function defToDataMapper(
  def?: TransformDefinition,
  options: Options = {}
): DataMapperWithState | AsyncDataMapperWithState {
  return operationToDataMapper(defToOperation(def, options), options)
}
