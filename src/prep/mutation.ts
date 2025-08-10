import prepPipeline, { TransformDefinition, Options } from './index.js'
import preparePathStep from './path.js'
import { isObject } from '../utils/is.js'
import type { MutationStep } from '../run/mutation.js'
import type { MutationObject, Path } from '../types.js'
import { PreppedPipeline, PreppedStep } from '../run/index.js'

const slashedRegex = /(?<!\\)\/\d+$/ // Matches /1 at the end, but not if the slash is escaped
const isSlashed = (path: Path) => slashedRegex.test(path)
const removeSlash = (path: Path) => path.replace(slashedRegex, '')

const allowedFirstStepOperations = ['mutation', 'alt']

// When a pipeline starts with no get step, i.e. the first step is not a path
// or a mutation object, we either plug it or add a get dot step.
function addStepWhenNoGetStep(pipeline: PreppedPipeline) {
  const firstStep = pipeline[0]
  if (typeof firstStep !== 'string') {
    if (
      isObject(firstStep) &&
      allowedFirstStepOperations.includes(firstStep.type)
    ) {
      // We have a mutation object or an allowed operation as the first step,
      // so add a get dot step, will cause a merge with the target when we go
      // in reverse.
      return ['.', ...pipeline]
    } else {
      // We have neighter a path or a mutation object as the first step, so
      // reverse plug the pipeline to skip it in reverse.
      return [...pipeline, '>|']
    }
  }
  return pipeline
}

const isUnknownDollarProp = (path: Path) =>
  path !== '$modify' && path[0] === '$'

// Prepare one property by setting the key as the set path at the end of the
// pipeline. Properties starting with `'$'` (unless it's `$modify`) or
// properties withtout pipelines are not included. Properties ending in `'[]'`
// with another mutation object as pipeline, is iterated.
function prepProp(
  setPath: string,
  pipeline: TransformDefinition | boolean,
  options: Options,
) {
  if (typeof pipeline === 'boolean') {
    if (setPath === '$modify' && pipeline) {
      // Replace the `$modify: true` shorthand with an empty pipeline
      pipeline = []
    } else {
      // For all other cases of a boolean pipeline -- skip it
      return undefined
    }
  }

  if (isUnknownDollarProp(setPath) || !pipeline) {
    return undefined
  }
  if (setPath.endsWith('[]') && isObject(pipeline)) {
    pipeline = { ...pipeline, $iterate: true }
  }
  if (setPath.includes('/')) {
    if (isSlashed(setPath)) {
      // We have a slashed property. Unslash it and plug the pipeline to only run it in reverse
      setPath = removeSlash(setPath)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      pipeline = ['|', pipeline!].flat() // We know this is not null or undefined, but TS doesn't seem to know that
    }

    // Make sure to unescape any slashes -- slashed property or not
    setPath = setPath.replace(/\\\//g, '/')
  }
  return addStepWhenNoGetStep([
    ...prepPipeline(pipeline, options),
    ...preparePathStep(`>${setPath}`),
  ])
}

const pathIsModify = (path: PreppedStep) => path === '...' || path === '>...'
const pipelineHasModify = (pipeline: PreppedPipeline) =>
  pipeline.some(pathIsModify)

const sortModifyLast = (a: PreppedPipeline, b: PreppedPipeline) =>
  Number(pipelineHasModify(a)) - Number(pipelineHasModify(b))

const hasModifyInBothDirections = (pipeline: PreppedPipeline) =>
  pipeline.some((path) => path === '...') &&
  pipeline.some((path) => path === '>...')

const isPipelineWithEffect = (
  pipeline?: PreppedPipeline,
): pipeline is PreppedPipeline =>
  !!pipeline && !hasModifyInBothDirections(pipeline)

/**
 * Prepare a mutation step and return the internal step format. Each property
 * on the mutation object is made into a pipeline, with the prop as set path at
 * the end. `$modify` and `$flip` props are set on the step object as `mod` and
 * `flip`. `$modify` is prepared as a pipeline of only path segments, with
 * `true` becomming an empty pipeline.
 */
export default function prepareMutationStep(
  { $flip: flip = false, ...props }: MutationObject,
  options: Options,
): MutationStep | undefined {
  const pipelines = Object.entries(props)
    .map(([setPath, pipeline]) =>
      prepProp(setPath, pipeline as TransformDefinition, options),
    )
    .filter(isPipelineWithEffect)
    .sort(sortModifyLast)

  // Skip mutations with only a $modify prop
  if (pipelines.length === 1 && pipelineHasModify(pipelines[0])) {
    return undefined
  }

  return {
    type: 'mutation',
    ...(flip && { flip }),
    pipelines,
  }
}
