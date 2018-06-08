import * as R from 'ramda'
import { IMapping, IFieldMapping, IData } from '../index.d'

type IDataOrArray = IData | IData[]
type IMapper = (data: IDataOrArray) => IDataOrArray
type ISingleMapper = (data: IData) => IData
type IFieldMapper = (target: IData, data: IData) => IData
type IFieldMappingTuple = [string, string | IFieldMapping]

interface IMapperWithRev extends IMapper {
  rev: IMapper
}

const _ = (R as any).__

const emptyPath = R.lensPath([])

// (a -> b) -> a | [a] -> b | [b]
const mapAny = (mapFn: (mappee: any) => any) => (mapee: any) => (mapee && typeof mapee.map === 'function')
  ? mapee.map(mapFn) : mapFn(mapee)

// String | b -> b
const normalizeFieldMapping = (fieldMapping: string | IFieldMapping): IFieldMapping =>
  (typeof fieldMapping === 'string')
    ? { path: fieldMapping }
    : fieldMapping

// Lens -> Lens -> (a -> (b -> a | b)) => (c -> c -> c)
const setFieldValue = (fromLens: R.Lens, toLens: R.Lens, setDefault: (def: any) => any): IFieldMapper =>
  (target, data) => R.set(
    toLens,
    setDefault(R.view(fromLens, data)),
    target
  )

// [String, a] -> Boolean -> (b -> b -> b)
const createFieldMapper = ([fieldId, fieldMapping]: IFieldMappingTuple) => {
  const { path, default: defaultFrom, defaultRev } = normalizeFieldMapping(fieldMapping)
  const fromLens = R.lensPath(path.split('.'))
  const toLens = R.lensPath(fieldId.split('.'))
  const setDefaultFrom = R.defaultTo(defaultFrom)
  const setDefaultTo = R.defaultTo(defaultRev)

  return (isRev: boolean): IFieldMapper => (isRev)
    ? setFieldValue(toLens, fromLens, setDefaultTo)
    : setFieldValue(fromLens, toLens, setDefaultFrom)
}

// [(a -> a -> a)] -> g a
const pipeMapperFns = (mapperFns: IFieldMapper[]): ISingleMapper =>
  (data) => mapperFns.reduce((target, fn) => fn(target, data), {})

// Lens -> (a -> a)
const setAtObjectPath = (lens: R.Lens): IMapper => R.set(lens, _, {}) as IMapper

// Lens -> (a -> a)
const getFromObjectPath = (lens: R.Lens): IMapper => R.view(lens)

const createObjectMapper = R.compose(
  pipeMapperFns,
  R.map(R.applyTo(false))
)

const createRevObjectMapper = R.compose(
  pipeMapperFns,
  R.reverse as (arr: IFieldMapper[]) => IFieldMapper[],
  R.map(R.applyTo(true))
)

/**
 * Will return a function that executes the mapping defined in `mapping`.
 * @param {Object} mapping - A mapping definition
 * @returns {function} A mapper function
 */
export default function mapTransform ({ fields, path }: IMapping): IMapperWithRev {
  const fieldMappers = R.toPairs(fields).map(createFieldMapper)
  const objectPath = (path) ? R.lensPath(path.split('.')) : emptyPath

  const mapper = R.compose(
    setAtObjectPath(objectPath),
    mapAny(createObjectMapper(fieldMappers))
  )

  const revMapper = R.compose(
    mapAny(createRevObjectMapper(fieldMappers)),
    getFromObjectPath(objectPath)
  )

  return Object.assign(mapper, { rev: revMapper })
}
