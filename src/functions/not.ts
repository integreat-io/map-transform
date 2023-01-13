import { DataMapper } from '../types.js'

export default function not(fn: DataMapper): DataMapper {
  return (value, state) => !fn(value, state)
}
