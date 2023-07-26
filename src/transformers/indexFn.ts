import type { Transformer } from '../types.js'

const transformer: Transformer = function index() {
  return () => async (_data, state) => {
    return state.index || 0
  }
}

export default transformer
