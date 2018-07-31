import * as R from 'ramda'
import { Data } from '..'
import { lensPath } from './lensPath'
import { pipeTransform, pipeTransformRev, TransformFunction } from './transformPipeline'
import { MappingDefNormalized } from './normalizeMapping'

export interface FieldMapperFunction {
  (target: Data, data: Data | null): Data
}

// Lens -> Lens -> (a -> b) -> (c -> (d -> c | d)) => (e -> e -> e)
const setFieldValue = (fromLens: R.Lens, toLens: R.Lens, transformFn: TransformFunction): FieldMapperFunction => (target, data) => {
  const value = R.view(fromLens, data)
  return (value === undefined)
    ? target
    : R.set(toLens, transformFn(value), target)
}
const setDefaultValue = (toLens: R.Lens, defaultValue: any): FieldMapperFunction => R.over(toLens, R.defaultTo(defaultValue))

/**
 * Create an object with field mapper functions. The default mapper – mapping
 * _from_ the source _to_ the target is at the `map` property, and the reverse
 * mapper is at `mapRev`.
 */
export const createFieldMapper = (def: MappingDefNormalized) => {
  const fromLens = lensPath(def.path)
  const toLens = lensPath(def.pathTo)
  const transformFn = pipeTransform(def.transform)
  const transformRevFn = pipeTransformRev(def.transformRev, def.transform)

  return {
    map: setFieldValue(fromLens, toLens, transformFn),
    mapRev: setFieldValue(toLens, fromLens, transformRevFn),
    complete: setDefaultValue(toLens, def.default),
    completeRev: setDefaultValue(fromLens, def.defaultRev)
  }
}
