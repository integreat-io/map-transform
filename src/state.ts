import { PreppedPipeline } from './run/index.js'

export interface InitialState {
  value?: unknown
  context?: unknown[]
  target?: unknown
  nonvalues?: unknown[]
  pipelines?: Map<string | symbol, PreppedPipeline>
  rev?: boolean
  flip?: boolean
  noDefaults?: boolean
  index?: number
}

const cloneContext = (context?: unknown[]) =>
  Array.isArray(context) ? [...context] : []

/**
 * Internal state used by the rewritten core.
 */
export default class State {
  #context: unknown[] = []

  value: unknown
  target: unknown
  nonvalues: unknown[]
  pipelines: Map<string | symbol, PreppedPipeline>
  rev: boolean
  flip: boolean
  noDefaults: boolean
  index?: number

  constructor(initialState?: InitialState, value?: unknown) {
    if (initialState?.context) {
      this.#context = cloneContext(initialState.context)
    }
    this.nonvalues = initialState?.nonvalues ?? [undefined]
    this.pipelines =
      initialState?.pipelines ?? new Map<string | symbol, PreppedPipeline>()
    this.value = initialState?.value
    this.target = initialState?.target
    this.rev = !!initialState?.rev
    this.flip = !!initialState?.flip
    this.noDefaults = !!initialState?.noDefaults
    this.index = initialState?.index

    if (arguments.length === 2) {
      this.value = value
    }
  }

  get context() {
    return this.#context
  }

  pushContext(value: unknown) {
    this.#context.push(value)
  }

  popContext() {
    return this.#context.pop()
  }

  replaceContext(context: unknown[]) {
    this.#context = context
  }

  clearContext() {
    this.#context = []
  }
}
