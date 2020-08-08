import Handlebars = require('handlebars')
import mapAny = require('map-any')
import getter from '../utils/pathGetter'
import { Path, DataMapper } from '../types'

interface Operands {
  template?: string
  templatePath?: Path
}

const extractOperands = (operands: Operands | string) =>
  typeof operands === 'string' ? { template: operands } : operands

export default function template(operands: Operands | string): DataMapper {
  const { template: templateStr, templatePath } = extractOperands(operands)

  if (typeof templateStr === 'string') {
    // We already got a template -- return a generator
    const generate = Handlebars.compile(templateStr)
    return (data) => mapAny((data: unknown) => generate(data), data)
  } else if (typeof templatePath === 'string') {
    // The template will be provided in the data -- return a function that will
    // both create the generator and run it
    const getFn = getter(templatePath)
    return (data) => {
      const templateStr = getFn(data)
      if (typeof templateStr === 'string') {
        const generate = Handlebars.compile(templateStr)
        return mapAny((data: unknown) => generate(data), data)
      }
      return undefined
    }
  }

  return () => undefined
}
