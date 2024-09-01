import {
  createDataMapper,
  createDataMapperAsync,
  DataMapper,
  DataMapperAsync,
} from '../createDataMapper.js'
import { ensureArray } from '../utils/array.js'
import { runIterator, runIteratorAsync } from '../utils/iterator.js'
import { revFromState } from '../utils/stateHelpers.js'
import State from '../state.js'
import type { Options, TransformDefinition } from '../prep/index.js'
import type {
  Transformer,
  AsyncTransformer,
  TransformerProps,
} from '../types.js'

export type Operator = 'AND' | 'OR'

export interface Props extends TransformerProps {
  path?: TransformDefinition | TransformDefinition[]
  operator?: Operator
}

export const getLogicalFn = (operator: Operator) =>
  operator === 'OR'
    ? (a: unknown, b: unknown) => Boolean(a) || Boolean(b)
    : (a: unknown, b: unknown) => Boolean(a) && Boolean(b)

const passOnSetState = (state: State, target: unknown) =>
  new State({
    ...state,
    target,
  })

// Do the logical operation. We yield the value return from the get or set
// functions, to allow the caller to await it if necessary. This is done to
// support both sync and async versions with as little code duplication as
// possible.
function* runLogicGen(
  data: unknown,
  state: State,
  getPipelines: DataMapper[],
  setPipelines: DataMapper[],
  operator: Operator,
): Generator<unknown, unknown, unknown> {
  if (revFromState(state)) {
    const value = Boolean(data)
    let obj: unknown
    for (const pipeline of setPipelines) {
      obj = yield pipeline(value, passOnSetState(state, obj))
    }
    return obj
  } else {
    const values = []
    for (const pipeline of getPipelines) {
      values.push(yield pipeline(data, state))
    }
    return values.reduce(getLogicalFn(operator))
  }
}

// Create the synchronous data mapper. We call the run logic generator and
// just iterate through the values it returns before getting the final value.
const createMapper = (
  getPipelines: DataMapper[],
  setPipelines: DataMapper[],
  operator: Operator = 'AND',
): DataMapper =>
  function runLogic(data, state) {
    const it = runLogicGen(
      data,
      state as State,
      getPipelines,
      setPipelines,
      operator,
    )
    return runIterator(it)
  }

// Create the asynchronous data mapper. We call the run logic generator and
// await each value it returns before getting the final value.
const createMapperAsync = (
  getPipelines: DataMapper[],
  setPipelines: DataMapper[],
  operator: Operator = 'AND',
): DataMapperAsync =>
  async function runLogic(data, state) {
    const it = runLogicGen(
      data,
      state as State,
      getPipelines,
      setPipelines,
      operator,
    )
    return runIteratorAsync(it)
  }

// Prepare get and set pipelines.
function prepare<T extends DataMapper | DataMapperAsync>(
  { path = '.' }: Props,
  options: Options,
  createDataMapper: (def: TransformDefinition, options: Partial<Options>) => T,
): [DataMapper[], DataMapper[]] {
  const pipelines: TransformDefinition[] = ensureArray(path)

  // Create mapper functions for all pipelines, for use when getting.
  const getPipelines = pipelines.map((pipeline) =>
    createDataMapper(pipeline, options),
  )

  // Create mapper function for all pipelines that is or starts with a path.
  // This is for setting values, and we only want pipelines that will actually
  // set something.
  const setPipelines = pipelines
    .filter(
      (pipeline) =>
        typeof pipeline === 'string' ||
        (Array.isArray(pipeline) && typeof pipeline[0] === 'string'),
    )
    .map((path) => createDataMapper(path, options))

  return [getPipelines, setPipelines]
}

/**
 * Perform a logical operation on the values from the paths given on `path`.
 * When the `operator` is `'AND'`, all the values will have to be `true` for
 * the result to be `true`. When the `operator` is `'OR'`, the result is `true`
 * when one or more of the values are `true`.
 *
 * This version does not supports async pipelines.
 */
export const logical: Transformer<Props> = function logical(props) {
  return (options) => {
    const [getPipelines, setPipelines] = prepare(
      props,
      options as Options,
      createDataMapper,
    )
    return createMapper(getPipelines, setPipelines, props.operator)
  }
}

/**
 * Perform a logical operation on the values from the paths given on `path`.
 * When the `operator` is `'AND'`, all the values will have to be `true` for
 * the result to be `true`. When the `operator` is `'OR'`, the result is `true`
 * when one or more of the values are `true`.
 *
 * This version supports async pipelines.
 */
export const logicalAsync: AsyncTransformer<Props> = function logical(props) {
  return (options) => {
    const [getPipelines, setPipelines] = prepare(
      props,
      options as Options,
      createDataMapperAsync,
    )
    return createMapperAsync(getPipelines, setPipelines, props.operator)
  }
}
