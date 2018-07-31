import * as R from 'ramda'
import { Definition, Data } from '..'
import { lensPath } from './lensPath'
import { createObjectMapper } from './createObjectMapper'
import { createFieldMapper } from './createFieldMapper'
import { pipeTransform, pipeTransformRev } from './transformPipeline'
import { pipeFilter } from './filterPipeline'
import { normalizeMapping } from './normalizeMapping'

interface BaseMapperFunction {
  (data: Data | null): Data | null
}

export interface MapperFunction extends BaseMapperFunction {
  rev?: MapperFunction,
  noDefaults?: BaseMapperFunction
}

interface MapperFunctionWithNoDefaults extends BaseMapperFunction {
  noDefaults: MapperFunction
}

export interface MapperFunctionWithRev extends MapperFunctionWithNoDefaults {
  rev: MapperFunctionWithNoDefaults
}

export const createMapper = (def: Definition): MapperFunctionWithRev => {
  const { mapping, pathRev, pathToRev, transform } = def
  const pathFromLens = lensPath(def.path)
  const pathToLens = lensPath(def.pathTo)
  const pathFromRevLens = (typeof pathRev !== 'undefined') ? lensPath(pathRev) : pathFromLens
  const pathToRevLens = (typeof pathToRev !== 'undefined') ? lensPath(pathToRev) : pathToLens

  const fieldMappers = (mapping) ? normalizeMapping(mapping).map(createFieldMapper) : []
  const transformFn = pipeTransform(transform)
  const transformRevFn = pipeTransformRev(def.transformRev, transform)
  const filterFn = pipeFilter(def.filter)

  const createMapper = createObjectMapper(
    fieldMappers,
    pathFromLens,
    pathToLens,
    transformFn,
    R.T,
    filterFn,
    false
  )

  const createRevMapper = createObjectMapper(
    fieldMappers,
    pathToRevLens,
    pathFromRevLens,
    transformRevFn,
    filterFn,
    R.T,
    true
  )

  return Object.assign(createMapper(), {
    noDefaults: createMapper(true),
    rev: Object.assign(createRevMapper(), {
      noDefaults: createRevMapper(true)
    })
  })
}
