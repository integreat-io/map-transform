import { DataMapper, Data } from '../types'

export default function not (fn: DataMapper<Data, boolean>): DataMapper<Data, boolean> {
  return (value, context) => !fn(value, context)
}
