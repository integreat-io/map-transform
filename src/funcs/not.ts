import { FilterFunction } from './filter'

export default function not (fn: FilterFunction): FilterFunction {
  return (value) => !fn(value)
}
