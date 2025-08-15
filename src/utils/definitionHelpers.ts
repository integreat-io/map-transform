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
import alt from '../operations/alt.js'
import apply from '../operations/apply.js'
import array from '../operations/array.js'
import { fwd, rev } from '../operations/directionals.js'
import { concat, concatRev } from '../operations/concat.js'
import { lookup, lookdown, Props as LookupProps } from '../operations/lookup.js'
import pipe, { pipeNext } from '../operations/pipe.js'
import { unescapeValue } from './escape.js'
import { ensureArray } from './array.js'
import type {
  Operation,
  NextStateMapper,
  TransformDefinition,
  TransformObject,
  Path,
  Pipeline,
  OperationObject,
  TransformOperation,
  FilterOperation,
  IfOperation,
  AltOperation,
  ApplyOperation,
  ArrayOperation,
  ConcatOperation,
  ConcatRevOperation,
  LookupOperation,
  LookdownOperation,
  Options,
  DataMapperWithState,
  DataMapperWithOptions,
  AsyncDataMapperWithOptions,
  State,
  StateMapper,
  AsyncDataMapperWithState,
  IterateOperation,
} from '../types.js'

const passStateThroughNext = (next: StateMapper) => async (state: State) =>
  next(state)

const nonOperatorKeys = [
  '$iterate',
  '$modify',
  '$noDefaults',
  '$flip',
  '$direction',
  '$alwaysApply',
]

const isOperatorKey = ([key, value]: [string, unknown]) =>
  key[0] === '$' &&
  (!nonOperatorKeys.includes(key) ||
    (key === '$iterate' && !!value && value !== true))

const isOperationObject = (def: unknown): def is OperationObject =>
  isObject(def) && Object.entries(def).filter(isOperatorKey).length > 0

export const isOperationType = <T extends OperationObject>(
  def: TransformObject | OperationObject,
  prop: string,
): def is T => Object.prototype.hasOwnProperty.call(def as object, prop)

export const isPath = (def: unknown): def is Path => typeof def === 'string'
export const isTransformObject = (def: unknown): def is TransformObject =>
  isObject(def) && !isOperationObject(def)
export const isPipeline = (def: unknown): def is Pipeline => Array.isArray(def)
export const isOperation = (def: unknown): def is Operation =>
  typeof def === 'function'
export const isTransformDefinition = (
  def: unknown,
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
  ops: Operation,
  def: OperationObject,
  options: Options,
): NextStateMapper {
  const opsWithNoDefaults =
    def.$noDefaults === true ? wrapInNoDefaults(ops) : ops
  const fn =
    def.$iterate === true ? iterate(opsWithNoDefaults) : opsWithNoDefaults
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

const humanizeOperatorName = (operatorProp: string) =>
  `${operatorProp[1].toUpperCase()}${operatorProp.slice(2)}`

function createOperation<U extends OperationObject>(
  operationFn: (
    fn: DataMapperWithOptions | AsyncDataMapperWithOptions,
  ) => Operation,
  fnProp: string,
  def: U,
  options: Options,
): NextStateMapper {
  const { [fnProp]: fnId, ...props } = def
  if (typeof fnId === 'function') {
    return wrapFromDefinition(
      operationFn(fnId as DataMapperWithOptions | AsyncDataMapperWithOptions), // We can only trust that the function has the right signature
      def,
      options,
    )
  }

  if (typeof fnId !== 'string' && typeof fnId !== 'symbol') {
    throw new Error(
      `${humanizeOperatorName(
        fnProp,
      )} operator was given no transformer id or an invalid transformer id`,
    )
  }

  // eslint-disable-next-line security/detect-object-injection
  const fn = options.transformers && options.transformers[fnId]
  if (typeof fn !== 'function') {
    throw new Error(
      `${humanizeOperatorName(
        fnProp,
      )} operator was given the unknown transformer id '${String(fnId)}'`,
    )
  }

  return typeof fn === 'function'
    ? wrapFromDefinition(operationFn(fn(props)), def, options)
    : passStateThroughNext
}

const createTransformOperation = (
  def: TransformOperation,
  options: Options,
): NextStateMapper => createOperation(transform, '$transform', def, options)

function createFilterOperation(
  def: FilterOperation,
  options: Options,
): NextStateMapper {
  const pipeline = def.$filter
  if (!pipeline) {
    // No pipeline or id -- throw
    throw new Error('Filter operator was given no transformer id or pipeline')
  } else if (
    typeof pipeline === 'string' ||
    typeof pipeline === 'symbol' ||
    typeof pipeline === 'function'
  ) {
    // This is the "traditional" approach -- create an operation the same way we do it for `$transform`
    return createOperation(filter, '$filter', def, options)
  } else {
    // This is the "new" approach, where we're given a pipeline
    const filterFn = () => defToDataMapper(pipeline, options) // Wrap data mapper in function, as `filter()` will pass `options` to the first level 
    return wrapFromDefinition(filter(filterFn), def, options)
  }
}

const setNoneValuesOnOptions = (options: Options, nonvalues?: unknown[]) =>
  Array.isArray(nonvalues)
    ? { ...options, nonvalues: nonvalues.map(unescapeValue) }
    : options

const createAltOperation = (
  def: AltOperation,
  options: Options,
): NextStateMapper | NextStateMapper[] => {
  const { $alt: defs, $undefined: nonvalues } = def
  return Array.isArray(defs)
    ? wrapFromDefinition(
        pipe(alt(...defs), true),
        def,
        setNoneValuesOnOptions(options, nonvalues),
      )
    : passStateThroughNext
}

const createArrayOperation = (
  def: ArrayOperation,
  options: Options,
): NextStateMapper => {
  const { $array: pipelines, $flip: flip } = def
  return Array.isArray(pipelines)
    ? wrapFromDefinition(array({ pipelines, flip }), def, options)
    : passStateThroughNext
}

const createIterateOperation = (
  def: IterateOperation,
  options: Options,
): NextStateMapper => {
  const { $iterate: pipeline } = def
  return pipeline
    ? wrapFromDefinition(iterate(pipeline), def, options)
    : passStateThroughNext
}

function createIfOperation(
  def: IfOperation,
  options: Options,
): NextStateMapper {
  const { $if: conditionPipeline, then: thenPipeline, else: elsePipeline } = def
  return wrapFromDefinition(
    ifelse(conditionPipeline, thenPipeline, elsePipeline),
    def,
    options,
  )
}

function createApplyOperation(def: ApplyOperation, options: Options) {
  const pipelineId = def.$apply
  return wrapFromDefinition(apply(pipelineId), def, options)
}

function createConcatOperation(
  operationFn: (...fn: TransformDefinition[]) => Operation,
  pipeline: TransformDefinition[],
  options: Options,
) {
  const pipelines = ensureArray(pipeline)
  return operationFn(...pipelines)(options)
}

function createLookupOperation(
  operationFn: (props: LookupProps) => Operation,
  def: LookupOperation | LookdownOperation,
  arrayPath: string,
  options: Options,
) {
  const { path: propPath, ...props } = def
  return wrapFromDefinition(
    operationFn({ ...props, arrayPath, propPath }),
    def,
    options,
  )
}

function nextStateMapperFromObject(
  defRaw: OperationObject | TransformObject,
  options: Options,
): NextStateMapper | NextStateMapper[] {
  const def = modifyOperationObject(defRaw, options.modifyOperationObject)

  if (isOperationObject(def)) {
    if (isOperationType<TransformOperation>(def, '$transform')) {
      return createTransformOperation(def, options)
    } else if (isOperationType<FilterOperation>(def, '$filter')) {
      return createFilterOperation(def, options)
    } else if (isOperationType<IfOperation>(def, '$if')) {
      return createIfOperation(def, options)
    } else if (isOperationType<AltOperation>(def, '$alt')) {
      return createAltOperation(def, options)
    } else if (isOperationType<ApplyOperation>(def, '$apply')) {
      return createApplyOperation(def, options)
    } else if (isOperationType<ArrayOperation>(def, '$array')) {
      return createArrayOperation(def, options)
    } else if (isOperationType<ConcatOperation>(def, '$concat')) {
      return createConcatOperation(concat, def.$concat, options)
    } else if (isOperationType<ConcatRevOperation>(def, '$concatRev')) {
      return createConcatOperation(concatRev, def.$concatRev, options)
    } else if (isOperationType<LookupOperation>(def, '$lookup')) {
      return createLookupOperation(lookup, def, def.$lookup, options)
    } else if (isOperationType<LookdownOperation>(def, '$lookdown')) {
      return createLookupOperation(lookdown, def, def.$lookdown, options)
    } else if (isOperationType<IterateOperation>(def, '$iterate')) {
      return createIterateOperation(def, options)
    } else {
      // Not a known operation
      return () => async (value) => value
    }
  } else {
    return props(def as TransformObject)(options)
  }
}

export function defToNextStateMappers(
  def: TransformDefinition | undefined,
  options: Options,
): NextStateMapper[] | NextStateMapper {
  if (isPipeline(def)) {
    return def.flatMap((def) => defToNextStateMappers(def, options))
  } else if (isObject(def)) {
    return nextStateMapperFromObject(def, options)
  } else if (isPath(def)) {
    return get(def).map((op) => op(options)) // Use `getNext` when we have it
  } else if (isOperation(def)) {
    return def(options)
  } else {
    return () => async (value) => value
  }
}

export function defToNextStateMapper(
  def: TransformDefinition | undefined,
  options: Options,
): NextStateMapper {
  const nextStateMappers = isPipeline(def)
    ? pipe(def)(options)
    : defToNextStateMappers(def, options)
  if (Array.isArray(nextStateMappers)) {
    return pipeNext(nextStateMappers)
  } else {
    return nextStateMappers
  }
}

function createDataMapper(
  nextStateMapper: NextStateMapper,
): DataMapperWithState | AsyncDataMapperWithState {
  const fn = nextStateMapper(noopNext)
  return async (value, state) =>
    getStateValue(await fn(setStateValue(state, value)))
}

export function defToDataMapper(
  def: TransformDefinition | undefined,
  options: Options,
): DataMapperWithState | AsyncDataMapperWithState {
  return createDataMapper(defToNextStateMapper(def, options))
}
