import { pipeNext } from './pipe.js'
import {
  setValueFromState,
  popContext,
  isNonvalueState,
  setStateValue,
  markAsUntouched,
  isUntouched,
} from '../utils/stateHelpers.js'
import { defToNextStateMappers } from '../utils/definitionHelpers.js'
import { noopNext } from '../utils/stateHelpers.js'
import type {
  NextStateMapper,
  Operation,
  State,
  StateMapper,
  TransformDefinition,
} from '../types.js'

// We run an array of operations through a pipe here when necessary, and specify
// that the pipe should return context
const pipeIfArray = (def: NextStateMapper | NextStateMapper[]) =>
  Array.isArray(def) ? pipeNext(def, true) : def

// Run the pipeline and return the value. If the state value has not been
// changed by the alt pipeline, we set it to undefined to correct the case where
// the alt pipeline is wrapped in `fwd` or `rev`, as these will simply return
// the state untouched when we move in the wrong direction. We don't want the
// untouched pipeline here, as a skipped pipeline should be treated as if it
// returned a nonvalue.
async function runAltPipeline(pipeline: StateMapper, state: State) {
  const afterState = await pipeline(markAsUntouched(state))
  return isUntouched(afterState)
    ? setStateValue(afterState, undefined)
    : afterState
}

// Run the first alt pipeline. If it returns a nonvalue, we push the context to
// make the original value available to the following pipelines. Pushing context
// also makes the parent path work as expected after the alt if all alt
// pipelines return nonvalues.
async function runAltFirst(
  state: State,
  pipeline: StateMapper,
  nonvalues?: unknown[],
) {
  // Run operation and set value if it is not a nonvalue
  const afterState = await runAltPipeline(pipeline, state)
  return isNonvalueState(afterState, nonvalues)
    ? setValueFromState(state, afterState, true) // We got a non-value, so set it on the original state
    : afterState // We got a value, so return it
}

// Run a pipeline that is not the first. We pop the context pushed by the first
// pipeline to get the original value if the first alt pipeline returned a
// nonvalue.
async function runAltRest(
  state: State,
  pipeline: StateMapper,
  nonvalues?: unknown[],
) {
  if (!isNonvalueState(state, nonvalues)) {
    // We already have a value, so we don't need to run the alt operation
    return state
  }

  // For all alts after the first, we remove the context pushed from the
  // first and provides it as the value.
  const beforeState = popContext(state)

  // Run operation and set value if it is not a nonvalue
  const afterState = await runAltPipeline(pipeline, beforeState)
  return isNonvalueState(afterState, nonvalues)
    ? setValueFromState(state, afterState) // We got a non-value, so set it on the original state
    : afterState // We got a value, so return it
}

const createAltFn = (
  next: StateMapper,
  pipeline: StateMapper,
  isFirst: boolean,
  nonvalues?: unknown[],
) =>
  async function runAlt(state: State) {
    const nextState = await next(state)
    const fn = isFirst ? runAltFirst : runAltRest // TODO: Do this one step up
    return await fn(nextState, pipeline, nonvalues)
  }

// Prepare the pipeline and return an operation that will run it if the state
// value is a nonvalue or if this is the first of several alt pipelines.
function createOneAltPipeline(
  def: TransformDefinition,
  index: number,
  hasOnlyOneAlt: boolean,
): Operation {
  return (options) => {
    const nextStateMapper = pipeIfArray(defToNextStateMappers(def, options))
    const isFirst = !hasOnlyOneAlt && index === 0
    return (next: StateMapper) =>
      createAltFn(next, nextStateMapper(noopNext), isFirst, options.nonvalues)
  }
}

/**
 * All alt operations are returned as individual operations, but the first one
 * is run in isolation (if it returns undefined, it will not polute the context)
 * and the rest are run only if the state value is not set. The exception is
 * when there is only one alt operation, in which case it is run as if it was
 * not the first (the "first" is the value already in the pipeline).
 */
export default function alt(...defs: TransformDefinition[]): Operation[] {
  const hasOnlyOneAlt = defs.length === 1
  return defs.map((def, index) =>
    createOneAltPipeline(def, index, hasOnlyOneAlt),
  )
}
