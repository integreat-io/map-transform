import * as R from 'ramda'
import { Data } from '..'
import { lensPath, PathString } from './lensPath'
import { pipeTransform, pipeTransformRev, TransformFunction, TransformPipeline } from './transformPipeline'

export interface MappingDefinition {
  path: PathString | null,
  transform?: TransformPipeline,
  transformRev?: TransformPipeline,
  default?: any,
  defaultRev?: any
}

export interface FieldMapperFunction {
  (target: Data, data: Data): Data
}
type GetFieldMapperFunction = (isRev: boolean) => FieldMapperFunction

type CreateFieldArgTuple = [string, PathString | MappingDefinition | null]

// String | b -> b
const normalizeFieldMapping = (fieldMapping: PathString | MappingDefinition | null): MappingDefinition =>
  (!fieldMapping || typeof fieldMapping === 'string')
    ? { path: fieldMapping }
    : fieldMapping

// Lens -> Lens -> (a -> b) -> (c -> (d -> c | d)) => (e -> e -> e)
const setFieldValue = (
  fromLens: R.Lens,
  toLens: R.Lens,
  transformFn: TransformFunction,
  setDefault: (def: any) => any
): FieldMapperFunction =>
  (target, data) => R.set(
    toLens,
    setDefault(transformFn(R.view(fromLens, data))),
    target
  )

/**
 * Create a function that returns a field mapper function. Call with `false` to
 * get a default mapper – mapping from the source to the target, and call with
 * `true` to get a reverse mapper going the other way.
 *
 * @param {Array} fieldMappingTuple - An array of the pathTo and the
 * fieldMapping definition
 * @returns {function} A function that returns a default or reverse mapper when
 * called with `false` or `true`
 */
export const createFieldMapper = ([fieldId, fieldMapping]: CreateFieldArgTuple): GetFieldMapperFunction => {
  const { path, default: def, defaultRev, transform, transformRev }
    = normalizeFieldMapping(fieldMapping)
  const fromLens = lensPath(path)
  const toLens = lensPath(fieldId)
  const setDefault = R.defaultTo(def)
  const setDefaultRev = R.defaultTo(defaultRev)
  const transformFn = pipeTransform(transform)
  const transformRevFn = pipeTransformRev(transformRev, transform)

  return (isRev) => (isRev)
    ? setFieldValue(toLens, fromLens, transformRevFn, setDefaultRev)
    : setFieldValue(fromLens, toLens, transformFn, setDefault)
}
