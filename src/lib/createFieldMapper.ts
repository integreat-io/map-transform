import * as R from 'ramda'
import { IFieldMapping, IFieldMapper } from '../../index.d'
import lensPath from './lensPath'

type IFieldMappingTuple = [string, string | IFieldMapping]
type IFieldMapperGetter = (isRev: boolean) => IFieldMapper

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
const createFieldMapper = ([fieldId, fieldMapping]: IFieldMappingTuple): IFieldMapperGetter => {
  const { path, default: def, defaultRev } = normalizeFieldMapping(fieldMapping)
  const fromLens = lensPath(path)
  const toLens = lensPath(fieldId)
  const setDefault = R.defaultTo(def)
  const setDefaultRev = R.defaultTo(defaultRev)

  return (isRev) => (isRev)
    ? setFieldValue(toLens, fromLens, setDefaultRev)
    : setFieldValue(fromLens, toLens, setDefault)
}

export default createFieldMapper
