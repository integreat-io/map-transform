import type { Transformer } from '../types.js'
import { isObject } from '../utils/is.js'

export interface KeyValue {
  key: string | number
  value: unknown
}

const isExplodedArray = (data: unknown[]) =>
  data.length > 0 &&
  data.every((item) => isObject(item) && typeof item.key === 'number')

const setValueOnKey = (
  target: unknown[] | Record<string, unknown>,
  keyValue: unknown
) => {
  if (isObject(keyValue)) {
    const { key, value } = keyValue
    if (Array.isArray(target)) {
      target[key as number] = value
    } else {
      target[String(key)] = value
    }
  }
  return target
}

function doImplode(data: unknown) {
  if (Array.isArray(data)) {
    return data.reduce(
      setValueOnKey,
      isExplodedArray(data)
        ? ([] as unknown[])
        : ({} as Record<string, unknown>)
    )
  } else {
    return undefined
  }
}

function doExplode(data: unknown): unknown[] | undefined {
  if (isObject(data)) {
    return Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]: [string, unknown]) => ({
        key,
        value,
      }))
  } else if (Array.isArray(data)) {
    return data.map((value: unknown, key: number) => ({ key, value }))
  } else {
    return undefined
  }
}

const explode: Transformer = function explode() {
  return () => async (data, state) =>
    state.rev ? doImplode(data) : doExplode(data)
}

const implode: Transformer = function implode() {
  return () => async (data, state) =>
    state.rev ? doExplode(data) : doImplode(data)
}

export { explode, implode }
