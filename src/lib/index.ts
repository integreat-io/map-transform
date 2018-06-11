import * as R from 'ramda'
import { IMapping, IData, IFieldMapper } from '../../index.d'
import lensPath from './lensPath'
import createFieldMapper from './createFieldMapper'

type IDataOrArray = IData | IData[]
type IMapper = (data: IDataOrArray) => IDataOrArray
type ISingleMapper = (data: IData) => IData

interface IMapperWithRev extends IMapper {
  rev: IMapper
}

const _ = (R as any).__

const noTransform: IMapper = (data: IDataOrArray) => data
const noTransformWithRev: IMapperWithRev = Object.assign(noTransform, { rev: (data: IDataOrArray) => data })

// (a -> b) -> a | [a] -> b | [b]
const mapAny = (mapFn: (mappee: any) => any) => (mapee: any) => (mapee && typeof mapee.map === 'function')
  ? mapee.map(mapFn) : mapFn(mapee)

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

/**
 * Will return a function that executes the mapping defined in `mapping`.
 * When no mapping is provided, an identity function is returned.
 *
 * @param {Object} mapping - A mapping definition
 * @returns {function} A mapper function
 */
export default function mapTransform (mapping?: IMapping | null): IMapperWithRev {
  if (!mapping) {
    return noTransformWithRev
  }

  const { fields, path, pathTo, pathRev, pathToRev } = mapping
  const pathLens = lensPath(path)
  const pathToLens = lensPath(pathTo)
  const pathRevLens = (pathRev) ? lensPath(pathRev) : pathLens
  const pathToRevLens = (pathToRev) ? lensPath(pathToRev) : pathToLens

  const fieldMappers = (fields) ? R.toPairs(fields).map(createFieldMapper) : []
  const objectMapper = createObjectMapper(fieldMappers)
  const revObjectMapper = createRevObjectMapper(fieldMappers)

  const mapper = R.compose(
    setAtObjectPath(pathToLens),
    mapAny(objectMapper),
    getFromObjectPath(pathLens)
  )

  const revMapper = R.compose(
    setAtObjectPath(pathRevLens),
    mapAny(revObjectMapper),
    getFromObjectPath(pathToRevLens)
  )

  return Object.assign(mapper, { rev: revMapper })
}
