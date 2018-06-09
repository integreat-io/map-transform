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
export default function mapTransform ({ fields, path, pathTo }: IMapping): IMapperWithRev {
  const fieldMappers = R.toPairs(fields).map(createFieldMapper)
  const objectPath = lensPath(path)
  const objectPathTo = lensPath(pathTo)

  const mapper = R.compose(
    setAtObjectPath(objectPathTo),
    mapAny(createObjectMapper(fieldMappers)),
    getFromObjectPath(objectPath)
  )

  const revMapper = R.compose(
    setAtObjectPath(objectPath),
    mapAny(createRevObjectMapper(fieldMappers)),
    getFromObjectPath(objectPathTo)
  )

  return Object.assign(mapper, { rev: revMapper })
}
