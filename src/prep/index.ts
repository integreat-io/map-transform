import prepareAltStep from './alt.js'
import prepareApplyStep from './apply.js'
import prepareArrayStep from './array.js'
import prepareFilterStep from './filter.js'
import prepareIfStep from './if.js'
import prepareMutationStep from './mutation.js'
import preparePathStep from './path.js'
import prepareTransformStep from './transform.js'
import prepareValueStep from './value.js'
import modifyOperation from './modifyOperation.js'
import { isNotNullOrUndefined } from '../utils/is.js'
import type { PreppedPipeline, StepProps, OperationStep } from '../run/index.js'
import type {
  Path,
  AltOperationNext as AltOperation,
  ApplyOperation,
  ArrayOperationNext as ArrayOperation,
  FilterOperation,
  IfOperationNext as IfOperation,
  TransformOperation,
  ValueOperation,
  MutationObject,
  Transformer,
  AsyncTransformer,
  Dictionaries,
} from '../types.js'

export type OperationObject =
  | AltOperation
  | ApplyOperation
  | ArrayOperation
  | FilterOperation
  | IfOperation
  | TransformOperation
  | ValueOperation
export type Step = Path | MutationObject | OperationObject | Pipeline
export type Pipeline = Step[]
export type TransformDefinition = Step | Pipeline | null

type ObjectStep = MutationObject | OperationObject

export interface Options {
  transformers?: Record<string | symbol, Transformer | AsyncTransformer>
  pipelines?: Record<string | symbol, TransformDefinition>
  neededPipelineIds?: Set<string | symbol>
  dictionaries?: Dictionaries
  nonvalues?: unknown[]
  fwdAlias?: string
  revAlias?: string
  modifyOperationObject?: (
    operation: Record<string, unknown>,
  ) => Record<string, unknown>
}

const isAltOperation = (step: ObjectStep): step is AltOperation =>
  Object.prototype.hasOwnProperty.call(step, '$alt')
const isApplyOperation = (step: ObjectStep): step is ApplyOperation =>
  Object.prototype.hasOwnProperty.call(step, '$apply')
const isArrayOperation = (step: ObjectStep): step is ArrayOperation =>
  Object.prototype.hasOwnProperty.call(step, '$array')
const isFilterOperation = (step: ObjectStep): step is FilterOperation =>
  Object.prototype.hasOwnProperty.call(step, '$filter')
const isIfOperation = (step: ObjectStep): step is IfOperation =>
  Object.prototype.hasOwnProperty.call(step, '$if')
const isTransformOperation = (step: ObjectStep): step is TransformOperation =>
  Object.prototype.hasOwnProperty.call(step, '$transform')
const isValueOperation = (step: ObjectStep): step is ValueOperation =>
  Object.prototype.hasOwnProperty.call(step, '$value')

// Convert the direction string into a number where 1 is forward, -1 is
// reverse, and 0 is no specified direction.
function getDir(dir: unknown, options: Options) {
  if (typeof dir === 'string') {
    if (dir === 'fwd' || dir === options.fwdAlias) {
      return 1
    } else if (dir === 'rev' || dir === options.revAlias) {
      return -1
    }
  }
  return 0
}

// Extract known operation object props from the step object and return both an
// object with these props, prepared for the internal operation format, and the
// step object without these props.
// The supported step props are:
// - `$iterate`: Causes the operation to be iterated if the pipeline value is
//   an array.
// - `$direction`: Will only run the operation in the specified direction.
// - `$noDefaults`: When true, no default values will be used.
// - `$nonvalues`: Will apply the list of nonvalues to options for the
//   operation and any child pipelines.
// - `$undefined`: An alias of `$nonvalues`. If both are set, `$nonvalues` will
//   be used.
function extractStepProps(
  {
    $iterate,
    $direction,
    $nonvalues,
    $noDefaults: noDefaults,
    $undefined,
    ...step
  }: MutationObject | OperationObject,
  options: Options,
): [StepProps | undefined, MutationObject | OperationObject] {
  const it = !!$iterate
  const dir = getDir($direction, options)
  const nonvalues = Array.isArray($nonvalues)
    ? $nonvalues
    : Array.isArray($undefined)
      ? $undefined
      : undefined
  return it || dir || noDefaults !== undefined || nonvalues
    ? [
        {
          ...(it && { it }),
          ...(dir && { dir }),
          ...(typeof noDefaults === 'boolean' && { noDefaults }),
          ...(nonvalues && { nonvalues }),
        },
        step,
      ]
    : [undefined, step]
}

// Merge the prepared operation props from `extractStepProps()` with the
// prepare step object.
const setStepProps = (step?: OperationStep, props?: StepProps) =>
  step && props ? { ...step, ...props } : step

// Figure out what type of operation this is and prepare it. If no operation
// matches, we treat it as a mutation object.
function prepareOperation(operation: ObjectStep, options: Options) {
  if (isTransformOperation(operation)) {
    // A transform operation
    return prepareTransformStep(operation, options)
  } else if (isValueOperation(operation)) {
    // A value operation
    return prepareValueStep(operation)
  } else if (isApplyOperation(operation)) {
    // An apply operation
    return prepareApplyStep(operation, options)
  } else if (isAltOperation(operation)) {
    // An alt operation
    return prepareAltStep(operation, options)
  } else if (isArrayOperation(operation)) {
    // An array operation
    return prepareArrayStep(operation, options)
  } else if (isIfOperation(operation)) {
    // An if operation
    return prepareIfStep(operation, options)
  } else if (isFilterOperation(operation)) {
    // A filter operation
    return prepareFilterStep(operation, options)
  } else {
    // The step matches none of the known operations, so treat it as
    // a mutation object
    return prepareMutationStep(operation, options)
  }
}

// Validate and prepare a step. If a step is an array (a sub-pipeline), we
// prepare it and return it, knowing it will be flattened into the pipeline
// this step is a part of.
const prepareStep = (options: Options) =>
  function prepareStep(step: Step | Pipeline | null) {
    if (Array.isArray(step)) {
      // A sub-pipeline
      return preparePipeline(step, options)
    } else if (typeof step === 'string') {
      // A path pipeline
      return preparePathStep(step)
    } else if (typeof step === 'function') {
      throw new Error('Operation functions are not supported anymore')
    } else if (step) {
      // An operation or mutation object step
      const [props, operation] = extractStepProps(
        modifyOperation(step, options),
        options,
      )
      const operationObject = prepareOperation(operation, options)
      return setStepProps(operationObject, props) // Set the step props that is common for all operations
    } else {
      return undefined
    }
  }

// Turn a single step into a pipeline.
const ensurePipeline = (def: TransformDefinition): Pipeline =>
  Array.isArray(def) ? def : !def ? [] : [def]

/**
 * Go through all steps in a pipeline definition, validate and converting each
 * step to the internal pipeline format that may be given to the
 * `runPipeline()` function.
 */
export default function preparePipeline(
  def: TransformDefinition,
  options: Options,
): PreppedPipeline {
  return ensurePipeline(def)
    .flatMap(prepareStep(options))
    .filter(isNotNullOrUndefined)
}
