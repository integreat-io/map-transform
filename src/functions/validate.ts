import Ajv from 'ajv'
import { Path, DataMapper } from '../types'
import getter from '../utils/pathGetter'

const ajv = new Ajv()

// TODO: Should accept operands instead of two args?
export default function validate(
  path: Path,
  schema: Record<string, unknown> | boolean
): DataMapper {
  const getFn = getter(path)
  const validate = ajv.compile(schema)

  return (data) => validate(getFn(data)) as boolean
}
