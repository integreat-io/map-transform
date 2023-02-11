import Mustache = require('mustache')
import mapAny = require('map-any')
import { Path, DataMapper, Options, TransformerProps } from '../types.js'
import { defsToDataMapper } from '../utils/definitionHelpers.js'
import { goForward } from '../utils/stateHelpers.js'

interface Props extends TransformerProps {
  template?: string
  templatePath?: Path
}

const extractProps = (props: Props | string) =>
  typeof props === 'string' ? { template: props } : props

function parseAndCreateGenerator(templateStr: string) {
  Mustache.parse(templateStr) // Mustache will keep the parsed template in a cache
  return (data: unknown) =>
    mapAny((data: unknown) => Mustache.render(templateStr, data), data)
}

export default function template(
  props: Props | string,
  _options: Options = {}
): DataMapper {
  const { template: templateStr, templatePath } = extractProps(props)

  if (typeof templateStr === 'string') {
    // We already got a template -- preparse it and return a generator
    return parseAndCreateGenerator(templateStr)
  } else if (typeof templatePath === 'string') {
    // The template will be provided in the data -- return a function that will
    // both create the generator and run it
    const getFn = defsToDataMapper(templatePath)
    return (data, state) => {
      const templateStr = getFn(data, goForward(state))
      if (typeof templateStr === 'string') {
        return parseAndCreateGenerator(templateStr)(data)
      }
      return undefined
    }
  }

  return () => undefined
}
