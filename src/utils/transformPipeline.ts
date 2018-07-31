import * as R from 'ramda'

export interface BaseTransformFunction {
  (value: any): any
}
export interface TransformFunction extends BaseTransformFunction {
  rev?: BaseTransformFunction
}

export type TransformPipeline = TransformFunction | TransformFunction[]

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

export const pipeTransform = (
  transform?: TransformPipeline
): TransformFunction =>
  (Array.isArray(transform))
    ? ((transform.length > 0) ? R.call(R.pipe, ...transform) : R.identity)
    : (transform || R.identity)

export const pipeTransformRev = (
  transformRev?: TransformPipeline,
  transform?: TransformPipeline
): TransformFunction =>
  (transformRev || !transform)
    ? pipeTransform(transformRev)
    : pipeTransform(extractRevPipeline(transform))
