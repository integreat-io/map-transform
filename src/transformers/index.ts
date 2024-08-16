import { value, fixed } from './value.js'
import bucket from './bucket.js'
import compare from './compare.js'
import { explode, implode } from './explode.js'
import flatten from './flatten.js'
import get from './get.js'
import index from './indexFn.js'
import logical from './logical.js'
import map from './map.js'
import { merge, mergeRev } from './merge.js'
import not from './not.js'
import notSync from './sync/not.js'
import project from './project.js'
import sort from './sort.js'

// Transformers that are not sync yet:
// - bucket
// - compare
// - logical
// - merge
export const sync = {
  explode,
  fixed,
  flatten,
  implode,
  index,
  map,
  not: notSync,
  project,
  sort,
  value,
}

export default {
  bucket,
  compare,
  explode,
  fixed,
  flatten,
  get,
  implode,
  index,
  logical,
  map,
  merge,
  mergeRev,
  not,
  project,
  sort,
  value,
}
