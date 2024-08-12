import runMutation, { MutationStep } from './mutation.js'
import runPath from './path.js'
import unwindTarget from './unwindTarget.js'
import { isObject } from '../utils/is.js'
import type { Path } from '../types.js'

export type PreppedStep = Path | MutationStep
export type PreppedPipeline = PreppedStep[]

/**
 * Run one the pipeline until a point where it needs to hand off to
 * another level (currently because of iteration). Will finish any
 * remainder of the pipeline when the lower levels are done.
 */
export function runOneLevel(
  value: unknown,
  pipeline: PreppedPipeline,
  target: unknown,
  isRev: boolean,
  context: unknown[],
) {
  let next = value
  let index = 0
  const targets = unwindTarget(target, pipeline, isRev)

  // We go through each step in the pipeline one by one until we're done
  while (index < pipeline.length) {
    const step = pipeline[index++]
    if (typeof step === 'string') {
      if (step === '[]' || step === '>[]') {
        // Ensure that the value is an array -- regardless of direction
        next = Array.isArray(next) ? next : [next]
      } else if (step[0] === '^') {
        if (step === '^^') {
          // Get the root from the context -- or the present
          // value when we have no context
          next = context.length === 0 ? next : context[0]
          context = []
        } else {
          // Get the parent value
          next = context.pop()
        }
      } else {
        // This is a path step -- handle it for both get and set
        ;[next, index] = runPath(
          next,
          pipeline,
          step,
          index,
          targets,
          target,
          isRev,
          context,
        )
      }
    } else if (isObject(step)) {
      next = runMutation(next, step)
    }
  }

  return next
}

function adjustPipelineToDirection(pipeline: PreppedPipeline, isRev: boolean) {
  // Reverse the steps when we're going in reverse
  const directedPipeline = isRev ? [...pipeline].reverse() : pipeline

  // Adjust pipeline for setting to parent or root
  const steps = []
  let skipCount = 0
  for (const step of directedPipeline) {
    if (isRev ? step === '^^' : step === '>^^') {
      // This is a root step -- skip the rest
      break
    } else if (isRev ? step === '^' : step === '>^') {
      // This is a parent step -- count how many to skip after this
      skipCount++
    } else if (skipCount > 0) {
      // This is path step and we're skipping
      skipCount--
    } else {
      // This is a path step -- keep it
      steps.push(step)
    }
  }

  return steps
}

/**
 * Applies the given pipeline on a value, and returns the resulting value.
 * If a `target` is given, any set steps will be attempted on the target, to
 * modify it with the corresponding values from the pipeline.
 */
export default function runPipeline(
  value: unknown,
  pipeline: PreppedPipeline,
  target?: unknown,
  isRev = false,
) {
  return runOneLevel(
    value,
    adjustPipelineToDirection(pipeline, isRev),
    target,
    isRev,
    [],
  )
}
