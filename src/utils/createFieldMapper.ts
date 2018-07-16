import * as R from 'ramda'
import { Data } from '..'
import { lensPath } from './lensPath'
import { pipeTransform, pipeTransformRev, TransformFunction } from './transformPipeline'
import { MappingDefNormalized } from './normalizeMapping'

export interface FieldMapperFunction {
  (target: Data, data: Data): Data
}
type GetFieldMapperFunction = (isRev: boolean) => FieldMapperFunction

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
export const createFieldMapper = (def: MappingDefNormalized): GetFieldMapperFunction => {
  const fromLens = lensPath(def.path)
  const toLens = lensPath(def.pathTo)
  const setDefault = R.defaultTo(def.default)
  const setDefaultRev = R.defaultTo(def.defaultRev)
  const transformFn = pipeTransform(def.transform)
  const transformRevFn = pipeTransformRev(def.transformRev, def.transform)

  return (isRev) => (isRev)
    ? setFieldValue(toLens, fromLens, transformRevFn, setDefaultRev)
    : setFieldValue(fromLens, toLens, transformFn, setDefault)
}
