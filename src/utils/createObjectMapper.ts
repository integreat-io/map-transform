import * as R from 'ramda'
import * as mapAny from 'map-any'
import { MapperFunction } from './createMapper'
import { TransformFunction } from './transformPipeline'
import { FieldMapperFunction } from './createFieldMapper'
import { FilterFunction } from './filterPipeline'

const _ = (R as any).__

const filterObj = (filterFn: FilterFunction, x: any) =>
  (filterFn(x)) ? x : null

const filterAny = (filterFn: FilterFunction) => (x: any) =>
  (x && typeof x.filter === 'function') ? x.filter(filterFn) : filterObj(filterFn, x)

// Lens -> (a -> a)
const setAtObjectPath = (lens: R.Lens): MapperFunction => R.set(lens, _, {}) as MapperFunction

// [(a -> a -> a)] -> g a
const reduceMapperFns = (mapperFns: FieldMapperFunction[]): MapperFunction =>
  (data) => (R.isNil(data))
    ? null
    : mapperFns.reduce((target, fn) => fn(target, data), {})

// Lens -> (a -> a)
const getFromObjectPath = (lens: R.Lens): MapperFunction => R.view(lens)

const getMapProp = (rev: boolean) => (rev) ? 'mapRev' : 'map'
const getCompleteProp = (rev: boolean) => (rev) ? 'completeRev' : 'complete'

const mapFieldsOrPassObject = (rev: boolean, noDefaults: boolean) => R.ifElse(
  R.isEmpty,
  R.always([R.nthArg(1)]),
  R.map((mapper: any) => (noDefaults)
    ? mapper[getMapProp(rev)]
    : R.compose(mapper[getCompleteProp(rev)], mapper[getMapProp(rev)]))
)

const mapObject = (
  rev: boolean,
  noDefaults: boolean,
  fieldMappers: object,
  transformFromFn: TransformFunction,
  transformToFn: TransformFunction
) => {
  const createFieldMappers = R.compose(
    reduceMapperFns,
    mapFieldsOrPassObject(rev, noDefaults)
  )

  return (rev)
    ? R.compose(transformFromFn, createFieldMappers(fieldMappers), transformToFn)
    : R.compose(transformToFn, createFieldMappers(fieldMappers), transformFromFn)
}

export const createObjectMapper = (
  pathFromLens: R.Lens,
  filterFromFn: R.Pred,
  transformFromFn: TransformFunction,
  fieldMappers: object,
  transformToFn: TransformFunction,
  filterToFn: R.Pred,
  pathToLens: R.Lens,
  isRev: boolean
) => (noDefaults = false): MapperFunction => R.compose(
    setAtObjectPath(pathToLens),
    filterAny(filterToFn),
    mapAny(mapObject(isRev, noDefaults, fieldMappers, transformFromFn, transformToFn)),
    filterAny(filterFromFn),
    getFromObjectPath(pathFromLens)
  )
