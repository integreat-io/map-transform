import { defToNextStateMapper } from '../utils/definitionHelpers.js'
import { revFromState } from '../utils/stateHelpers.js'
import type {
  TransformDefinition,
  Operation,
  Options,
  State,
  StateMapper,
} from '../types.js'

const applyInDirection =
  (def: TransformDefinition, shouldRunRev: boolean): Operation =>
  (options: Options) =>
  (next) => {
    const fn = defToNextStateMapper(def, options)(next)
    return async function applyFwdOrRev(state) {
      return !!state.rev === shouldRunRev ? await fn(state) : await next(state)
    }
  }

const createDivideFn = (
  fwdFn: StateMapper,
  revFn: StateMapper,
  doHonorFlip: boolean,
) =>
  async function applyDivide(state: State) {
    const isRev = doHonorFlip ? revFromState(state) : !!state.rev
    return isRev ? await revFn(state) : await fwdFn(state)
  }

export function fwd(def: TransformDefinition): Operation {
  return applyInDirection(def, false)
}

export function rev(def: TransformDefinition): Operation {
  return applyInDirection(def, true)
}

export function divide(
  fwdDef: TransformDefinition,
  revDef: TransformDefinition,
  doHonorFlip = false,
): Operation {
  return (options) => (next) => {
    const fwdFn = defToNextStateMapper(fwdDef, options)(next)
    const revFn = defToNextStateMapper(revDef, options)(next)
    return createDivideFn(fwdFn, revFn, doHonorFlip)
  }
}
