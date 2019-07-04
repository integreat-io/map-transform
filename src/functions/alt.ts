import { Data, Operands, Context } from '../types'

interface Options extends Operands {
  // path?: string
  value?: Data
}

export default function alt({ value }: Options) {
  return (data: Data, context?: Context) => {
    const { onlyMappedValues = false } = context || {}
    return typeof data === 'undefined' && !onlyMappedValues ? value : data
  }
}
