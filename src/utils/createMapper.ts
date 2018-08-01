import { Definition, DefinitionNormalized, Data } from '..'
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

const resolveAliases = (def: Definition): DefinitionNormalized => ({
  pathFrom: def.path || def.pathFrom,
  pathFromRev: (typeof def.pathRev !== 'undefined') ? def.pathRev : def.pathFromRev,
  filterFrom: def.filterFrom,
  filterFromRev: def.filterFromRev,
  transformFrom: def.transformFrom,
  transformFromRev: def.transformFromRev,
  mapping: def.mapping,
  transformTo: def.transform || def.transformTo,
  transformToRev: def.transformRev || def.transformToRev,
  filterTo: def.filter || def.filterTo,
  filterToRev: (typeof def.filterRev !== 'undefined') ? def.filterRev : def.filterToRev,
  pathTo: def.pathTo,
  pathToRev: def.pathToRev
})

const setupNormAndRev = <T, U>(fn: (arg: U) => T, norm: U, rev: U): [T, T] => {
  const normRes = fn(norm)
  const revRes = (typeof rev !== 'undefined') ? fn(rev) : normRes
  return [normRes, revRes]
}

export const createMapper = (def: Definition): MapperFunctionWithRev => {
  const d = resolveAliases(def)

  const [pathFromLens, pathFromRevLens] = setupNormAndRev(lensPath, d.pathFrom, d.pathFromRev)
  const [filterFromFn, filterFromRevFn] = setupNormAndRev(pipeFilter, d.filterFrom, d.filterFromRev)

  const transformFromFn = pipeTransform(d.transformFrom)
  const transformFromRevFn = pipeTransformRev(d.transformFromRev, d.transformFrom)

  const fieldMappers = (d.mapping) ? normalizeMapping(d.mapping).map(createFieldMapper) : []

  const transformToFn = pipeTransform(d.transformTo)
  const transformToRevFn = pipeTransformRev(d.transformToRev, d.transformTo)

  const [filterToFn, filterToRevFn] = setupNormAndRev(pipeFilter, d.filterTo, d.filterToRev)
  const [pathToLens, pathToRevLens] = setupNormAndRev(lensPath, d.pathTo, d.pathToRev)

  const createMapper = createObjectMapper(
    pathFromLens,
    filterFromFn,
    transformFromFn,
    fieldMappers,
    transformToFn,
    filterToFn,
    pathToLens,
    false // isRev
  )

  const createRevMapper = createObjectMapper(
    pathToRevLens,
    filterToRevFn,
    transformFromRevFn,
    fieldMappers,
    transformToRevFn,
    filterFromRevFn,
    pathFromRevLens,
    true // isRev
  )

  return Object.assign(createMapper(), {
    noDefaults: createMapper(true),
    rev: Object.assign(createRevMapper(), {
      noDefaults: createRevMapper(true)
    })
  })
}
