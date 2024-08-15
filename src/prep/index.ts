import prepareMutationStep from './mutation.js'
import preparePathStep from './path.js'
import prepareTransformStep from './transform.js'
import prepareValueStep from './value.js'
import { isNotNullOrUndefined } from '../utils/is.js'
import type { PreppedPipeline, StepProps, OperationStep } from '../run/index.js'
import type {
  Options,
  Path,
  TransformOperation,
  ValueOperation,
  MutationObject,
  OperationObject,
} from '../types.js'

export type Step = Path | MutationObject | OperationObject | Pipeline
export type Pipeline = Step[]
export type Def = Step | Pipeline
export type DataMapper = (value: unknown) => unknown

type ObjectStep = MutationObject | OperationObject

const isTransformOperation = (step: ObjectStep): step is TransformOperation =>
  step.hasOwnProperty('$transform')
const isValueOperation = (step: ObjectStep): step is ValueOperation =>
  step.hasOwnProperty('$value')

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
function extractStepProps(
  { $iterate, $direction, ...step }: MutationObject | OperationObject,
  options: Options,
): [StepProps | undefined, MutationObject | OperationObject] {
  const it = !!$iterate
  const dir = getDir($direction, options)
  return it || dir
    ? [
        {
          ...(it && { it }),
          ...(dir && { dir }),
        },
        step,
      ]
    : [undefined, step]
}

// Merge the prepared operation props from `extractStepProps()` with the
// prepare step object.
const setStepProps = (step?: OperationStep, props?: StepProps) =>
  step && props ? { ...step, ...props } : step

// Validate and prepare a step. If a step is an array (a sub-pipeline), we
// prepare it and return it, knowing it will be flattened into the pipeline
// this step is a part of.
const prepareStep = (options: Options) =>
  function prepareStep(step: Step | Pipeline) {
    if (Array.isArray(step)) {
      // A sub-pipeline
      return prepPipeline(step, options)
    } else if (typeof step === 'string') {
      // A path pipeline
      return preparePathStep(step)
    } else {
      // An operation or mutation object step
      const [props, operation] = extractStepProps(step, options)

      if (isTransformOperation(operation)) {
        // A transform operation
        return setStepProps(prepareTransformStep(operation, options), props)
      } else if (isValueOperation(operation)) {
        // A value operation
        return setStepProps(prepareValueStep(operation), props)
      } else {
        // The step matches none of the known operations, so treat it as
        // a mutation object
        return setStepProps(prepareMutationStep(operation, options), props)
      }
    }
  }

// Turn a single step into a pipeline.
const ensurePipeline = (def: Def): Pipeline =>
  Array.isArray(def) ? def : [def]

/**
 * Go through all steps in a pipeline definition, validate and converting each
 * step to the internal pipeline format that may be given to the
 * `runPipeline()` function.
 */
export default function prepPipeline(
  def: Def,
  options: Options,
): PreppedPipeline {
  return ensurePipeline(def)
    .flatMap(prepareStep(options))
    .filter(isNotNullOrUndefined)
}
