import Ajv from 'ajv'
import { Path, DataMapper, Operands as BaseOperands, Options } from '../types'
import { defsToDataMapper } from '../utils/definitionHelpers'

const ajv = new Ajv()

interface Operands extends BaseOperands {
  path: Path
  schema: Record<string, unknown> | boolean
}

export default function validate(
  { path, schema }: Operands,
  _options: Options = {}
): DataMapper {
  const getFn = defsToDataMapper(path)
  const validate = ajv.compile(schema)

  return (data) => validate(getFn(data)) as boolean
}
