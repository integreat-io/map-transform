import { DataMapper } from '../types.js'

export default function compare(): DataMapper {
  return (_data, state) => {
    return state.index || 0
  }
}
