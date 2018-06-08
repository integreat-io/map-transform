import * as R from 'ramda'
import { IMapping, IFieldMapping, IData } from '../index.d'

type IDataOrArray = IData | IData[]
type IMapper = (data: IDataOrArray) => IDataOrArray
type ISingleMapper = (data: IData) => IData
type IFieldMapper = (target: IData, data: IData) => IData
type IFieldMappingTuple = [string, string | IFieldMapping]

// (a -> b) -> a | [a] -> b | [b]
const mapAny = (mapFn: (mappee: any) => any) => (mapee: any) => (mapee && typeof mapee.map === 'function')
  ? mapee.map(mapFn) : mapFn(mapee)

// String | b -> b
const normalizeFieldMapping = (fieldMapping: string | IFieldMapping): IFieldMapping =>
  (typeof fieldMapping === 'string')
    ? { path: fieldMapping }
    : fieldMapping

// [String, a] -> (b -> b -> b)
const createFieldMapper = ([fieldId, fieldMapping]: IFieldMappingTuple): IFieldMapper => {
  const { path, default: def } = normalizeFieldMapping(fieldMapping)
  const fromLens = R.lensPath(path.split('.'))
  const toLens = R.lensPath(fieldId.split('.'))
  const defaultTo = R.defaultTo(def)

  return (target, data) => R.set(
    toLens,
    defaultTo(R.view(fromLens, data)),
    target
  )
}

// [(a -> a -> a)] -> g a
const pipeMapperFns = (mapperFns: IFieldMapper[]): ISingleMapper =>
  (data) => mapperFns.reduce((target, fn) => fn(target, data), {})

// a -> (b -> b)
const setAtObjectPath = (path?: string): IMapper => {
  if (!path) {
    return (data) => data
  }

  const lens = R.lensPath(path.split('.'))

  return (data) => {
    return R.set(lens, data, {})
  }
}

/**
 * Will return a function that executes the mapping defined in `mapping`.
 * @param {Object} mapping - A mapping definition
 * @returns {function} A mapper function
 */
export default function mapTransform ({ fields, path }: IMapping): IMapper {
  const mapperFn = pipeMapperFns(
    R.toPairs(fields).map(createFieldMapper)
  )

  return R.compose(
    setAtObjectPath(path),
    mapAny(mapperFn)
  )
}
