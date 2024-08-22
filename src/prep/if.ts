import type { IfStep } from '../run/if.js'
import preparePipeline, { Options } from './index.js'
import type { IfOperationNext as IfOperation } from '../types.js'

export default function prepareIfStep(
  {
    $if: condition,
    then: thenPipeline = null,
    else: elsePipeline = null,
  }: IfOperation,
  options: Options,
): IfStep {
  return {
    type: 'if',
    condition: preparePipeline(condition, options),
    then: preparePipeline(thenPipeline, options),
    else: preparePipeline(elsePipeline, options),
  }
}
