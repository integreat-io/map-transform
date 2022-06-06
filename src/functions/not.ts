import { DataMapper } from '../types'

export default function not(fn: DataMapper): DataMapper {
  return (value, state) => !fn(value, state)
}
