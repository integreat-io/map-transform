import { value, fixed } from './value.js'
import bucket from './bucket.js'
import compare from './compare.js'
import { explode, implode } from './explode.js'
import flatten from './flatten.js'
import get from './get.js'
import index from './indexFn.js'
import logical from './logical.js'
import map from './map.js'
import { merge, mergeRev, mergeAsync, mergeRevAsync } from './merge.js'
import not from './not.js'
import notSync from './notSync.js'
import project from './project.js'
import sort from './sort.js'

// Transformers that are not sync yet:
// - bucket
// - compare
// - logical
export const sync = {
  explode,
  fixed,
  flatten,
  implode,
  index,
  map,
  merge,
  mergeRev,
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
  merge: mergeAsync,
  mergeRev: mergeRevAsync,
  not,
  project,
  sort,
  value,
}
