import { TransformerProps, DataMapper, Options } from '../types.js'
import { defsToDataMapper } from '../utils/definitionHelpers.js'

interface GetProps extends TransformerProps {
  path?: string
}

const extractPath = (path: GetProps | string) =>
  typeof path === 'string' ? path : path.path

export default function get(
  props: GetProps | string,
  _options: Options = {}
): DataMapper {
  const path = extractPath(props) || '.'
  const getFn = defsToDataMapper(path)

  return getFn
}
