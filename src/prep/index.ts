import preparePathStep from './path.js'
import prepareTransformStep from './transform.js'
import type { PreppedPipeline, StepProps } from '../run/index.js'
import type { Options, Path, TransformOperation } from '../types.js'

export type Step = Path | TransformOperation
export type Pipeline = Step[]
export type Def = Step | Pipeline
export type DataMapper = (value: unknown) => unknown

function getDir(dir: string | undefined, options: Options) {
  if (typeof dir === 'string') {
    if (dir === 'fwd' || dir === options.fwdAlias) {
      return 1
    } else if (dir === 'rev' || dir === options.revAlias) {
      return -1
    }
  }
  return 0
}

function extractStepProps(
  { $iterate, $direction, ...step }: TransformOperation,
  options: Options,
): [StepProps, TransformOperation] {
  const it = !!$iterate
  const dir = getDir($direction, options)
  return it || dir
    ? [
        {
          ...(it && { it }),
          ...(dir && { dir }),
        },
        step,
      ]
    : [{}, step]
}

const prepareStep = (options: Options) =>
  function prepareStep(step: Step | Pipeline) {
    if (typeof step === 'string') {
      return preparePathStep(step)
    } else {
      const [props, operation] = extractStepProps(step, options)
      return { ...prepareTransformStep(operation, options), ...props }
    }
  }

const ensurePipeline = (def: Def): Pipeline =>
  Array.isArray(def) ? def : [def]

export default function prep(def: Def, options: Options): PreppedPipeline {
  return ensurePipeline(def).flatMap(prepareStep(options))
}
