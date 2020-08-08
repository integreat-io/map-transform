import test from 'ava'
import { isObject } from '../utils/is'
import { set } from './getSet'

import ifelse from './ifelse'

// Setup

const options = {}

const truePipeline = set('active[]')
const falsePipeline = set('inactive[]')

// Tests

test('should run truePipeline when true', (t) => {
  const conditionFn = (data: unknown) => isObject(data) && data.active
  const data = { active: true }
  const state = {
    root: data,
    context: data,
    value: data,
  }
  const expected = {
    root: data,
    context: data,
    value: { active: [data] },
  }

  const ret = ifelse(conditionFn, truePipeline, falsePipeline)(options)(state)

  t.deepEqual(ret, expected)
})

test('should run falsePipeline when false', (t) => {
  const conditionFn = (data: unknown) => isObject(data) && data.active
  const data = { active: false }
  const state = {
    root: data,
    context: data,
    value: data,
  }
  const expectedValue = { inactive: [data] }

  const ret = ifelse(conditionFn, truePipeline, falsePipeline)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should do nothing when true and no truePipeline', (t) => {
  const conditionFn = (data: unknown) => isObject(data) && data.active
  const data = { active: true }
  const state = {
    root: data,
    context: data,
    value: data,
  }

  const ret = ifelse(conditionFn, undefined, falsePipeline)(options)(state)

  t.deepEqual(ret, state)
})

test('should do nothing when false and no falsePipeline', (t) => {
  const conditionFn = (data: unknown) => isObject(data) && data.active
  const data = { active: false }
  const state = {
    root: data,
    context: data,
    value: data,
  }

  const ret = ifelse(conditionFn, truePipeline)(options)(state)

  t.deepEqual(ret, state)
})

test('should run falsePipeline when no conditionFn', (t) => {
  const data = { active: true }
  const state = {
    root: data,
    context: data,
    value: data,
  }
  const expectedValue = { inactive: [data] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret = ifelse(undefined as any, truePipeline, falsePipeline)(options)(
    state
  )

  t.deepEqual(ret.value, expectedValue)
})
