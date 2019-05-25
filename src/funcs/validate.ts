import Ajv = require('ajv')
import { Path, Data } from '../types'
import getter from '../utils/pathGetter'

const ajv = new Ajv()

export default function validate (path: Path, schema: object | boolean) {
  const getFn = getter(path)
  const validate = ajv.compile(schema)

  return (data: Data) => validate(getFn(data)) as boolean
}
