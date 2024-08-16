import prepPipeline, { TransformDefinition, Options } from './index.js'
import preparePathStep from './path.js'
import { isNotNullOrUndefined, isObject } from '../utils/is.js'
import type { MutationStep } from '../run/mutation.js'
import type { MutationObject, Path } from '../types.js'
import { PreppedPipeline } from '../run/index.js'

const slashedRegex = /(?<!\\)\/\d+$/ // Matches /1 at the end, but not if the slash is escaped
const isSlashed = (path: Path) => slashedRegex.test(path)
const removeSlash = (path: Path) => path.replace(slashedRegex, '')

// When a pipeline starts with no get step, i.e. the first step is not a path
// or a mutation object, we either plug it or add a get dot step.
function addStepWhenNoGetStep(pipeline: PreppedPipeline) {
  const firstStep = pipeline[0]
  if (typeof firstStep !== 'string') {
    if (isObject(firstStep) && firstStep.type === 'mutation') {
      // We have a mutation object as the first step, so add a get dot step,
      // will cause a merge with the target when we go in reverse.
      return ['.', ...pipeline]
    } else {
      // We have neighter a path or a mutation object as the first step, so
      // reverse plug the pipeline to skip it in reverse.
      return [...pipeline, '>|']
    }
  }
  return pipeline
}

// Prepare one property by setting the key as the set path at the end of the
// pipeline. Properties starting with `'$'` or properties withtout pipelines
// are not included. Properties ending in `'[]'` with another mutation object
// as pipeline, is iterated.
function prepProp(
  setPath: string,
  pipeline: TransformDefinition,
  options: Options,
) {
  if (setPath.startsWith('\\$')) {
    setPath = setPath.slice(1)
  } else if (setPath[0] === '$' || !pipeline) {
    return undefined
  }
  if (setPath.endsWith('[]') && isObject(pipeline)) {
    pipeline = { ...pipeline, $iterate: true }
  }
  if (setPath.includes('/')) {
    if (isSlashed(setPath)) {
      // We have a slashed property. Unslash it and plug the pipeline to only run it in reverse
      setPath = removeSlash(setPath)
      pipeline = ['|', pipeline].flat()
    }

    // Make sure to unescape any slashes -- slashed property or not
    setPath = setPath.replace(/\\\//g, '/')
  }
  return addStepWhenNoGetStep([
    ...prepPipeline(pipeline, options),
    ...preparePathStep(`>${setPath}`),
  ])
}

/**
 * Prepare a mutation step and return the internal step format. Each property
 * on the mutation object is made into a pipeline, with the prop as set path at
 * the end. `$modify` and `$flip` props are set on the step object as `mod` and
 * `flip`. `$modify` is prepared as a pipeline of only path segments, with
 * `true` becomming an empty pipeline.
 */
export default function prepareMutationStep(
  {
    $modify,
    $flip: flip = false,
    $noDefaults: noDefaults,
    ...props
  }: MutationObject,
  options: Options,
): MutationStep | undefined {
  const pipelines = Object.entries(props)
    .map(([setPath, pipeline]) =>
      prepProp(setPath, pipeline as TransformDefinition, options),
    )
    .filter(isNotNullOrUndefined)
  if (pipelines.length === 0 && $modify === true) {
    return undefined
  }

  const mod =
    $modify === true
      ? []
      : typeof $modify === 'string'
        ? preparePathStep($modify)
        : undefined

  return {
    type: 'mutation',
    ...(flip && { flip }),
    ...(mod && { mod }),
    ...(typeof noDefaults === 'boolean' ? { noDefaults } : {}),
    pipelines,
  }
}
