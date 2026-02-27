import { value, fixed } from './value.js'
import { bucket, bucketAsync } from './bucket.js'
import { compare, compareAsync } from './compare.js'
import { concat, concatAsync, concatRev, concatRevAsync } from './concat.js'
import { explode, implode } from './explode.js'
import flatten from './flatten.js'
import index from './indexFn.js'
import { logical, logicalAsync } from './logical.js'
import { lookup, lookupAsync, lookdown, lookdownAsync } from './lookup.js'
import map from './map.js'
import { merge, mergeRev, mergeAsync, mergeRevAsync } from './merge.js'
import { not, notAsync } from './not.js'
import project from './project.js'
import sort from './sort.js'

export const sync = {
  bucket,
  compare,
  concat,
  concatRev,
  explode,
  fixed,
  flatten,
  implode,
  index,
  logical,
  lookup,
  lookdown,
  map,
  merge,
  mergeRev,
  not,
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
  lookup: lookupAsync,
  lookdown: lookdownAsync,
  map,
  merge: mergeAsync,
  mergeRev: mergeRevAsync,
  not: notAsync,
  project,
  sort,
  value,
}
