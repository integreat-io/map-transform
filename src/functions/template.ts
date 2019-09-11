import Handlebars = require('handlebars')
import mapAny = require('map-any')
import { Data } from '../types'

interface Operands {
  template?: string
}

export default function template(operands: Operands | string) {
  const templateStr =
    typeof operands === 'object' && operands ? operands.template : operands
  if (typeof templateStr !== 'string') {
    return () => undefined
  }

  const generate = Handlebars.compile(templateStr)
  return (data: Data) => mapAny((data: Data) => generate(data), data)
}
