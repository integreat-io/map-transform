import { DataMapper } from '../types'

export default function not(fn: DataMapper): DataMapper {
  return (value, context) => !fn(value, context)
}
