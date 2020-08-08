import Handlebars = require('handlebars')
import mapAny = require('map-any')
import getter from '../utils/pathGetter'
import { Data, Path, DataMapper } from '../types'

interface Operands {
  template?: string
  templatePath?: Path
}

const extractOperands = (operands: Operands | string) =>
  typeof operands === 'string'
    ? { template: operands }
    : typeof operands === 'object' && operands !== null
    ? operands
    : {}

export default function template(operands: Operands | string): DataMapper {
  const { template: templateStr, templatePath } = extractOperands(operands)
  if (typeof templateStr === 'string') {
    const generate = Handlebars.compile(templateStr)
    return (data) => mapAny((data: Data) => generate(data), data)
  } else if (typeof templatePath === 'string') {
    const getFn = getter(templatePath)
    return (data) => {
      const templateStr = getFn(data)
      if (typeof templateStr === 'string') {
        const generate = Handlebars.compile(templateStr)
        return mapAny((data: Data) => generate(data), data)
      }
      return undefined
    }
  }

  return () => undefined
}
