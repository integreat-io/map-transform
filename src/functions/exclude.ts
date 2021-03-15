import { Data, Operands } from '../types'
import getter from '../utils/pathGetter'

interface Options extends Operands {
  path?: string
  excludePath?: string
}

const ensureArray = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value]

const getArray = (path?: string) => (path ? getter(path) : () => [])

export default function exclude({ path, excludePath }: Options) {
  const getArrFn = getArray(path)
  const getExcludeFn = getArray(excludePath)

  return (data: Data) => {
    const arr = ensureArray(getArrFn(data))
    const exclude = ensureArray(getExcludeFn(data))
    return arr.filter(value => !exclude.includes(value))
  }
}
