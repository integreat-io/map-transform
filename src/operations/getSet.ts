/* eslint-disable security/detect-object-injection */
import mapAny = require('map-any')
import {
  getStateValue,
  setStateValue,
  getTargetFromState,
  setTargetOnState,
  getLastContext,
  getRootFromState,
} from '../utils/stateHelpers.js'
import { isObject } from '../utils/is.js'
import { ensureArray, indexOfIfArray } from '../utils/array.js'
import { compose, identity } from '../utils/functional.js'
import { Path, Operation, State, StateMapper } from '../types.js'
import xor from '../utils/xor.js'

const adjustIsSet = (isSet: boolean, { rev = false, flip = false }: State) =>
  xor(isSet, xor(rev, flip))

function flatMapAny(fn: (value: unknown, target?: unknown) => unknown) {
  return (value: unknown, target?: unknown) =>
    Array.isArray(value)
      ? value.flatMap((value) => fn(value, target))
      : fn(value, target)
}

function preparePath(
  path: string | number
): [string | number, boolean, boolean] {
  if (typeof path === 'string' && path.includes('[')) {
    if (path.endsWith('][')) {
      return [path.slice(0, path.length - 2), false, true]
    }
    const pos = path.indexOf('[')
    if (path[pos - 1] === '\\') {
      return [path.replace('\\[', '['), false, false]
    } else {
      const isArr = path[pos + 1] === ']'
      return [path.slice(0, pos), isArr, false]
    }
  }

  return [path, false, false]
}

function getSetProp(path: string) {
  if (path === '') {
    // Don't set empty path
    return identity
  }

  const getFn = flatMapAny((value) =>
    isObject(value) ? value[path] : undefined
  )
  const setFn = (value: unknown, target?: unknown) =>
    isObject(target) ? { ...target, [path]: value } : { [path]: value }

  return (value: unknown, isSet: boolean, target?: unknown) => {
    if (isSet) {
      return setFn(value, target)
    } else {
      return getFn(value)
    }
  }
}

function getSetIndex(index: number) {
  return (value: unknown, isSet: boolean, target?: unknown) => {
    if (isSet) {
      const arr = Array.isArray(target) ? [...target] : []
      arr[index] = value
      return arr
    } else {
      return Array.isArray(value) ? value[index] : undefined
    }
  }
}

function getParent(state: State) {
  const nextValue = getLastContext(state)
  const nextContext = state.context.slice(0, -1)
  return { ...state, context: nextContext, value: nextValue }
}

function getRoot(state: State) {
  const nextValue = getRootFromState(state)
  return { ...state, context: [], value: nextValue }
}

function getSet(isSet = false) {
  return (path: string | number): Operation => {
    if (typeof path === 'string' && path[0] === '^') {
      const getFn = path[1] === '^' ? getRoot : getParent
      return () => (next) => (state) => {
        if (adjustIsSet(isSet, state)) {
          // Simple return target instead of setting anything
          return setStateValue(next(state), state.target)
        } else {
          // Get root
          return next(getFn(state))
        }
      }
    }

    const [basePath, isArr, isIndexProp] = preparePath(path)
    const isIndex = typeof basePath === 'number'
    const getArrAwareStateValue = isArr
      ? compose(ensureArray, getStateValue)
      : getStateValue
    const getSetFn = isIndex ? getSetIndex(basePath) : getSetProp(basePath)

    return (_options) =>
      (next) =>
      (state: State): State => {
        if (adjustIsSet(isSet, state)) {
          // We're setting, so we'll go backwards first. Start by preparing target for the next set
          const target = getTargetFromState(state)
          const nextTarget = getSetFn(target, false)

          // Invoke the "previous" path part with the right target, iterate if array
          const nextState = next(
            setTargetOnState(
              { ...state, iterate: state.iterate || isArr },
              nextTarget
            )
          )

          // Now it's our turn. Set the state value - and iterate it if necessary
          const setIt = (value: unknown, index?: number) =>
            getSetFn(value, true, indexOfIfArray(target, index))
          const nextValue = getArrAwareStateValue(nextState)
          const thisValue =
            nextState.iterate && !isArr && !isIndexProp
              ? mapAny(setIt, nextValue)
              : setIt(nextValue)

          // Return the value
          return setStateValue(state, thisValue)
        } else {
          // Go backwards
          const nextState = next(state)
          const thisValue = getSetFn(getStateValue(nextState), false)

          return setStateValue(
            nextState,
            isArr ? ensureArray(thisValue) : thisValue,
            true // Push to context
          )
        }
      }
  }
}

function dividePath(path: string) {
  const pos = path.indexOf('[')
  if (pos > -1 && path[pos - 1] !== '\\') {
    const index = Number.parseInt(path.slice(pos + 1), 10)
    if (!Number.isNaN(index)) {
      const basePath = path.slice(0, pos).trim()
      return basePath ? [`${basePath}][`, index] : [index] // `][` is our crazy notation for an index prop
    }
  } else if (path.startsWith('^')) {
    if (path.startsWith('^^') && path.length > 2) {
      return ['^^', path.slice(2)]
    } else if (path.length > 1 && path !== '^^') {
      return ['^^', path.slice(1)]
    }
  }
  return path.trim()
}

function pathToNextOperations(path: Path, isSet = false): Operation[] {
  if (!path || path === '.') {
    return [() => (next: StateMapper) => (state: State) => next(state)]
  }

  if (path[0] === '>') {
    path = path.slice(1)
    isSet = true
  }

  const parts = path.split('.').flatMap(dividePath)
  const operations = parts.map(getSet(isSet))
  if (isSet) {
    operations.reverse()
  }
  return operations
}

export const get = (path: Path) => pathToNextOperations(path, false)
export const set = (path: Path) => pathToNextOperations(path, true)
