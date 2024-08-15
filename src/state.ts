export interface InitialState {
  value?: unknown
  context?: unknown[]
  target?: unknown
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

  value: unknown = undefined
  target: unknown = undefined
  rev = false
  flip = false
  noDefaults = false
  index?: number = undefined

  constructor(initialState?: InitialState, value?: unknown) {
    if (initialState) {
      this.#context = cloneContext(initialState.context)
      this.value = initialState.value
      this.target = initialState.target
      this.rev = initialState.rev ?? false
      this.flip = initialState.flip ?? false
      this.noDefaults = initialState.noDefaults ?? false
      this.index = initialState.index
    }
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

  clearContext() {
    this.#context = []
  }
}
