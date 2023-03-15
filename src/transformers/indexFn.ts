import { Transformer } from '../types.js'

const transformer: Transformer = function index() {
  return () => (_data, state) => {
    return state.index || 0
  }
}

export default transformer
