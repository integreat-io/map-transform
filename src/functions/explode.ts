import { Data, DataObject, Context } from '../types'
import { isObject } from '../utils/is'

export interface KeyValue {
  key: string | number
  value: Data
}

const isExplodedArray = (data: Data[]) =>
  data.every(item => isObject(item) && typeof item.key === 'number')

const setValueOnKey = (target: Data[] | DataObject, keyValue: Data) => {
  if (isObject(keyValue)) {
    const { key, value } = keyValue
    if (Array.isArray(target)) {
      target[key as number] = value // eslint-disable-line security/detect-object-injection
    } else {
      target[String(key)] = value // eslint-disable-line security/detect-object-injection
    }
  }
  return target
}

function doImplode(data: Data) {
  if (Array.isArray(data)) {
    return data.reduce(
      setValueOnKey,
      isExplodedArray(data) ? ([] as Data[]) : ({} as DataObject)
    )
  } else {
    return undefined
  }
}

function doExplode(data: Data): Data[] | undefined {
  if (isObject(data)) {
    return Object.entries(data).map(([key, value]: [string, Data]) => ({
      key,
      value
    }))
  } else if (Array.isArray(data)) {
    return data.map((value: Data, key: number) => ({ key, value }))
  } else {
    return undefined
  }
}

export default function explode() {
  return (data: Data, context: Context): Data =>
    context.rev ? doImplode(data) : doExplode(data)
}
