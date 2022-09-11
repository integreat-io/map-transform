import { DataMapper } from '../types'

export default function compare(): DataMapper {
  return (_data, state) => {
    return state.index || 0
  }
}
