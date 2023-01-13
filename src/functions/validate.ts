import ajv from 'ajv'
import {
  Path,
  DataMapper,
  Operands as BaseOperands,
  Options,
} from '../types.js'
import { defsToDataMapper } from '../utils/definitionHelpers.js'

const Ajv = ajv.default

const validator = new Ajv()

interface Operands extends BaseOperands {
  path: Path
  schema: Record<string, unknown> | boolean
}

export default function validate(
  { path, schema }: Operands,
  _options: Options = {}
): DataMapper {
  const getFn = defsToDataMapper(path)
  const validate = validator.compile(schema)

  return (data) => validate(getFn(data)) as boolean
}
