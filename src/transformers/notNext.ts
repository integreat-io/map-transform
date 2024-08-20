import type { Transformer } from '../types.js'

const transformer: Transformer = () => () =>
  function not(value, _state) {
    return !value
  }

export default transformer
