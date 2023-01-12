import { Operands, DataMapper, Options } from '../types'
import { defsToDataMapper } from '../utils/definitionHelpers'

interface GetOperands extends Operands {
  path?: string
}

const extractPath = (path: GetOperands | string) =>
  typeof path === 'string' ? path : path.path

export default function get(
  options: GetOperands | string,
  _options: Options = {}
): DataMapper {
  const path = extractPath(options) || '.'
  const getFn = defsToDataMapper(path)

  return (data) => getFn(data)
}
