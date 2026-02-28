import xor from './utils/xor.js'
import type { PreppedPipeline } from './run/index.js'

export interface InitialState {
  value?: unknown
  root?: unknown
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
 * Internal state.
 */
export default class State {
  value: unknown
  root: unknown
  context: unknown[] = []
  target: unknown
  nonvalues: unknown[]
  pipelines: Map<string | symbol, PreppedPipeline>
  rev: boolean
  flip: boolean
  noDefaults: boolean
  index?: number

  constructor(initialState?: InitialState, value?: unknown) {
    if (initialState?.context) {
      this.context = cloneContext(initialState.context)
    }
    this.nonvalues = initialState?.nonvalues ?? [undefined]
    this.pipelines =
      initialState?.pipelines ?? new Map<string | symbol, PreppedPipeline>()
    this.value = initialState?.value
    this.root = initialState?.root
    this.target = initialState?.target
    this.rev = !!initialState?.rev
    this.flip = !!initialState?.flip
    this.noDefaults = !!initialState?.noDefaults
    this.index = initialState?.index

    if (arguments.length === 2) {
      this.value = value
      if (this.root === undefined) {
        this.root = value
      }
    }
  }

  /**
   * Return true if the state is currently in reverse. Will take `flip` into
   * account.
   */
  get isRev() {
    return xor(this.rev, this.flip)
  }

  /**
   * Return the same state, but in forward mode. Any flipped state is cleared.
   */
  forwardState() {
    if (this.rev || this.flip) {
      return new State({ ...this, rev: false, flip: false })
    } else {
      return this
    }
  }

  /**
   * Return the same state, but in reverse mode. Any flipped state is cleared.
   */
  revState() {
    if (!this.rev || this.flip) {
      return new State({ ...this, rev: true, flip: false })
    } else {
      return this
    }
  }

  /**
   * Return the same state, but with the opposite value of `flip`.
   */
  flipState() {
    return new State({ ...this, flip: !this.flip })
  }
}
