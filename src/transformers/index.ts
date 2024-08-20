import { value, fixed } from './value.js'
import bucket from './bucket.js'
import { bucket as bucketSync, bucketAsync } from './bucketNext.js'
import compare from './compare.js'
import { compare as compareSync, compareAsync } from './compareNext.js'
import { explode, implode } from './explode.js'
import flatten from './flatten.js'
import get from './get.js'
import index from './indexFn.js'
import logical from './logical.js'
import map from './map.js'
import { merge, mergeRev, mergeAsync, mergeRevAsync } from './merge.js'
import not from './not.js'
import notNext from './notNext.js'
import project from './project.js'
import sort from './sort.js'

// Transformers that are not sync yet:
// - logical
export const sync = {
  bucket: bucketSync,
  compare: compareSync,
  explode,
  fixed,
  flatten,
  implode,
  index,
  map,
  merge,
  mergeRev,
  not: notNext,
  project,
  sort,
  value,
}

export const async = {
  bucket: bucketAsync,
  compare: compareAsync,
  explode,
  fixed,
  flatten,
  implode,
  index,
  map,
  merge: mergeAsync,
  mergeRev: mergeRevAsync,
  not: notNext,
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
