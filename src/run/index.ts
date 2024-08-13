import runMutationStep, { MutationStep } from './mutation.js'
import runTransformStep, { TransformStep } from './transform.js'
import runPath from './path.js'
import unwindTarget from './unwindTarget.js'
import { isObject } from '../utils/is.js'
import type { Path, InitialState, State } from '../types.js'

export interface StepProps {
  it?: boolean
  dir?: number
}

export type OperationStep = (MutationStep | TransformStep) & StepProps
export type PreppedStep = Path | OperationStep
export type PreppedPipeline = PreppedStep[]

export type RunStep<T extends OperationStep> = (
  value: unknown,
  step: T,
  state: State,
) => unknown

const isOperationObject = (step: PreppedStep): step is OperationStep =>
  isObject(step) && typeof step.type === 'string'

const shouldRun = (step: OperationStep, isRev: boolean) =>
  step.dir && typeof step.dir === 'number'
    ? step.dir < 0
      ? isRev
      : !isRev
    : true

const shouldIterate = (
  value: unknown,
  step: OperationStep,
): value is unknown[] => !!step.it && Array.isArray(value)

function getOperationForStep<T extends OperationStep>(
  step: T,
): RunStep<T> | undefined {
  switch (step.type) {
    case 'mutation':
      return runMutationStep as RunStep<T> // TODO: Make typing work without forcing to RunStep?
    case 'transform':
      return runTransformStep as RunStep<T>
    default:
      return undefined
  }
}

/**
 * Run one the pipeline until a point where it needs to hand off to
 * another level (currently because of iteration). Will finish any
 * remainder of the pipeline when the lower levels are done.
 */
export function runOneLevel(
  value: unknown,
  pipeline: PreppedPipeline,
  state: State,
) {
  const isRev = !!state.rev
  let context = state.context
  const targets = unwindTarget(state.target, pipeline, isRev)
  let next = value
  let index = 0

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
        const nextState = { ...state, context, value: next }
        ;[next, index] = runPath(
          next,
          pipeline,
          step,
          index,
          targets,
          nextState,
        )
      }
    } else if (isOperationObject(step)) {
      const op = getOperationForStep(step)
      if (op && shouldRun(step, isRev)) {
        // This is an operation step and we are not being stopped by the
        // direction we are going in -- run it with or without iterating
        next = shouldIterate(next, step)
          ? next.map((value) => op(value, step, state))
          : op(next, step, state)
      }
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
      // We're skipping this step
      skipCount--
    } else {
      // We are not skipping steps
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
  initialState: InitialState,
) {
  const state = { ...initialState, context: [], value }
  return runOneLevel(
    value,
    adjustPipelineToDirection(pipeline, !!state.rev),
    state,
  )
}
