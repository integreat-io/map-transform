import * as R from 'ramda'

export interface FilterFunction {
  (value: any): boolean
}

export type FilterPipeline = FilterFunction | FilterFunction[]

export const pipeFilter = (filters?: FilterPipeline) => (Array.isArray(filters))
  ? (filters.length > 0) ? R.allPass(filters) : R.T
  : filters || R.T
