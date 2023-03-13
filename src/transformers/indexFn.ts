import { DataMapper } from '../types.js'

export default function index(): DataMapper {
  return (_data, state) => {
    return state.index || 0
  }
}
