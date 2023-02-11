import ajv from 'ajv'
import { Path, DataMapper, TransformerProps, Options } from '../types.js'
import { defsToDataMapper } from '../utils/definitionHelpers.js'
import { goForward } from '../utils/stateHelpers.js'

const Ajv = ajv.default

const validator = new Ajv()

interface Props extends TransformerProps {
  path: Path
  schema: Record<string, unknown> | boolean
}

export default function validate(
  { path, schema }: Props,
  _options: Options = {}
): DataMapper {
  const getFn = defsToDataMapper(path)
  const validate = validator.compile(schema)

  return (data, state) => validate(getFn(data, goForward(state))) as boolean
}
