import Mustache = require('mustache')
import mapAny = require('map-any')
import getter from '../utils/pathGetter'
import { Path, DataMapper } from '../types'

interface Operands {
  template?: string
  templatePath?: Path
}

const extractOperands = (operands: Operands | string) =>
  typeof operands === 'string' ? { template: operands } : operands

function parseAndCreateGenerator(templateStr: string) {
  Mustache.parse(templateStr) // Mustache will keep the parsed template in a cache
  return (data: unknown) =>
    mapAny((data: unknown) => Mustache.render(templateStr, data), data)
}

export default function template(operands: Operands | string): DataMapper {
  const { template: templateStr, templatePath } = extractOperands(operands)

  if (typeof templateStr === 'string') {
    // We already got a template -- preparse it and return a generator
    return parseAndCreateGenerator(templateStr)
  } else if (typeof templatePath === 'string') {
    // The template will be provided in the data -- return a function that will
    // both create the generator and run it
    const getFn = getter(templatePath)
    return (data) => {
      const templateStr = getFn(data)
      if (typeof templateStr === 'string') {
        return parseAndCreateGenerator(templateStr)(data)
      }
      return undefined
    }
  }

  return () => undefined
}
