import * as R from 'ramda'
import { IMapping, IData, IFieldMapper, FilterPipeline, FilterFunction } from '../..'
import lensPath from './lensPath'
import createFieldMapper from './createFieldMapper'
import { pipeTransform, pipeTransformRev } from './transformPipeline'

type IDataOrArray = IData | IData[]
type IMapper = (data: IDataOrArray | null) => IDataOrArray | null
type ISingleMapper = (data: IData) => IData

interface IMapperWithRev extends IMapper {
  rev: IMapper
}

const _ = (R as any).__

const noTransform: IMapper = (data: IDataOrArray | null) => data
const noTransformWithRev: IMapperWithRev = Object.assign(noTransform, { rev: R.identity })

// (a -> b) -> a | [a] -> b | [b]
const mapAny = (mapFn: (x: any) => any) => (x: any) =>
  (x && typeof x.map === 'function') ? x.map(mapFn) : mapFn(x)

const filterObj = (filterFn: FilterFunction, x: any) =>
  (filterFn(x)) ? x : null

const filterAny = (filterFn: FilterFunction) => (x: any) =>
  (x && typeof x.filter === 'function') ? x.filter(filterFn) : filterObj(filterFn, x)

// [(a -> a -> a)] -> g a
const pipeMapperFns = (mapperFns: IFieldMapper[]): ISingleMapper =>
  (data) => mapperFns.reduce((target, fn) => fn(target, data), {})

// Lens -> (a -> a)
const setAtObjectPath = (lens: R.Lens): IMapper => R.set(lens, _, {}) as IMapper

// Lens -> (a -> a)
const getFromObjectPath = (lens: R.Lens): IMapper => R.view(lens)

const mapFieldsOrPassObject = (isRev: boolean) => R.ifElse(
  R.isEmpty,
  R.always([R.nthArg(1)]),
  R.map(R.applyTo(isRev))
)

const createObjectMapper = R.compose(
  pipeMapperFns,
  mapFieldsOrPassObject(false)
)

const createRevObjectMapper = R.compose(
  pipeMapperFns,
  R.reverse as (arr: IFieldMapper[]) => IFieldMapper[],
  mapFieldsOrPassObject(true)
)

const pipeFilter = (filters?: FilterPipeline) => (Array.isArray(filters))
  ? (filters.length > 0) ? R.allPass(filters) : R.T
  : filters || R.T

const createMapper = (mapping: IMapping): IMapperWithRev => {
  const { fields, pathRev, pathToRev, transform } = mapping
  const pathLens = lensPath(mapping.path)
  const pathToLens = lensPath(mapping.pathTo)
  const pathRevLens = (typeof pathRev !== 'undefined') ? lensPath(pathRev) : pathLens
  const pathToRevLens = (typeof pathToRev !== 'undefined') ? lensPath(pathToRev) : pathToLens

  const fieldMappers = (fields) ? R.toPairs(fields).map(createFieldMapper) : []
  const objectMapper = createObjectMapper(fieldMappers)
  const revObjectMapper = createRevObjectMapper(fieldMappers)
  const transformFn = pipeTransform(transform)
  const transformRevFn = pipeTransformRev(mapping.transformRev, transform)
  const filterFn = pipeFilter(mapping.filter)

  const mapper = R.compose(
    setAtObjectPath(pathToLens),
    filterAny(filterFn),
    mapAny(R.compose(transformFn, objectMapper)),
    getFromObjectPath(pathLens)
  )

  const revMapper = R.compose(
    setAtObjectPath(pathRevLens),
    mapAny(R.compose(revObjectMapper, transformRevFn)),
    filterAny(filterFn),
    getFromObjectPath(pathToRevLens)
  )

  return Object.assign(mapper, { rev: revMapper })
}

/**
 * Will return a function that executes the mapping defined in `mapping`.
 * When no mapping is provided, an identity function is returned.
 *
 * @param {Object} mapping - A mapping definition
 * @returns {function} A mapper function
 */
export default function mapTransform (mapping?: IMapping | null): IMapperWithRev {
  return (mapping) ? createMapper(mapping) : noTransformWithRev
}
