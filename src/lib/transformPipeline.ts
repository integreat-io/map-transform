import * as R from 'ramda'
import { TransformFunction, Transform } from '../../index.d'

const extractRev = (fn: TransformFunction) => fn && fn.rev || undefined

const extractRevArray = R.pipe(
  R.map(extractRev),
  R.filter(R.complement(R.isNil)),
  (arr) => arr.reverse()
)

const extractRevPipeline = R.ifElse(
  Array.isArray,
  extractRevArray,
  extractRev
)

export const pipeTransform = (transform?: Transform) => (Array.isArray(transform))
  ? ((transform.length > 0) ? R.call(R.pipe, ...transform) : R.identity)
  : (transform || R.identity)

export const pipeTransformRev = (transformRev?: Transform, transform?: Transform) =>
  (transformRev || !transform)
    ? pipeTransform(transformRev)
    : pipeTransform(extractRevPipeline(transform))
