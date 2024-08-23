import { value, fixed } from './value.js'
import bucket from './bucket.js'
import { bucket as bucketSync, bucketAsync } from './bucketNext.js'
import compare from './compare.js'
import { compare as compareSync, compareAsync } from './compareNext.js'
import { concat, concatAsync, concatRev, concatRevAsync } from './concat.js'
import { explode, implode } from './explode.js'
import flatten from './flatten.js'
import get from './get.js'
import index from './indexFn.js'
import logical from './logical.js'
import { logical as logicalSync, logicalAsync } from './logicalNext.js'
import map from './map.js'
import { merge, mergeRev } from './merge.js'
import {
  merge as mergeSync,
  mergeRev as mergeRevSync,
  mergeAsync,
  mergeRevAsync,
} from './mergeNext.js'
import not from './not.js'
import { not as notSync, notAsync } from './notNext.js'
import project from './project.js'
import sort from './sort.js'

export const sync = {
  bucket: bucketSync,
  compare: compareSync,
  concat,
  concatRev,
  explode,
  fixed,
  flatten,
  implode,
  index,
  logical: logicalSync,
  map,
  merge: mergeSync,
  mergeRev: mergeRevSync,
  not: notSync,
  project,
  sort,
  value,
}

export const async = {
  bucket: bucketAsync,
  compare: compareAsync,
  concat: concatAsync,
  concatRev: concatRevAsync,
  explode,
  fixed,
  flatten,
  implode,
  index,
  logical: logicalAsync,
  map,
  merge: mergeAsync,
  mergeRev: mergeRevAsync,
  not: notAsync,
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
