import { Path, Data } from '../types'
import getter from '../utils/pathGetter'

export default function compare (path: Path, value: string | number | boolean) {
  const getFn = getter(path)

  return (data: Data) => {
    const comparee = getFn(data)
    return (Array.isArray(comparee)) ? comparee.includes(value) : comparee === value
  }
}
