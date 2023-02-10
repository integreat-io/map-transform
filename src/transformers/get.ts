import { Operands, DataMapper, Options } from '../types.js'
import { defsToDataMapper } from '../utils/definitionHelpers.js'

interface GetOperands extends Operands {
  path?: string
}

const extractPath = (path: GetOperands | string) =>
  typeof path === 'string' ? path : path.path

export default function get(
  operands: GetOperands | string,
  _options: Options = {}
): DataMapper {
  const path = extractPath(operands) || '.'
  const getFn = defsToDataMapper(path)

  return getFn
}
