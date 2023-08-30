import { isObject } from '../utils/is.js'
import { revFromState } from '../utils/stateHelpers.js'
import type { Transformer } from '../types.js'

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

function explodeOrImplode(isImplode: boolean): Transformer {
  return () => () => async (data, state) =>
    revFromState(state, isImplode) ? doImplode(data) : doExplode(data)
}

export const explode: Transformer = explodeOrImplode(false)
export const implode: Transformer = explodeOrImplode(true)
