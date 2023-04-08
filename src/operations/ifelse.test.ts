import test from 'ava'
import sinon from 'sinon'
import { isObject } from '../utils/is.js'
import { set } from './getSet.js'
import { identity } from '../utils/functional.js'

import ifelse from './ifelse.js'

// Setup

const options = {}

const truePipeline = set('active[]')
const falsePipeline = set('inactive[]')

// Tests

test('should run truePipeline when true', (t) => {
  const conditionFn = (data: unknown) => isObject(data) && data.active
  const data = { active: true }
  const state = {
    context: [],
    value: data,
  }
  const expected = {
    context: [],
    value: { active: [data] },
  }

  const ret = ifelse(conditionFn, truePipeline, falsePipeline)(options)(
    identity
  )(state)

  t.deepEqual(ret, expected)
})

test('should run falsePipeline when false', (t) => {
  const conditionFn = (data: unknown) => isObject(data) && data.active
  const data = { active: false }
  const state = {
    context: [],
    value: data,
  }
  const expectedValue = { inactive: [data] }

  const ret = ifelse(conditionFn, truePipeline, falsePipeline)(options)(
    identity
  )(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should do nothing when true and no truePipeline', (t) => {
  const conditionFn = (data: unknown) => isObject(data) && data.active
  const data = { active: true }
  const state = {
    context: [],
    value: data,
  }

  const ret = ifelse(conditionFn, undefined, falsePipeline)(options)(identity)(
    state
  )

  t.deepEqual(ret, state)
})

test('should do nothing when false and no falsePipeline', (t) => {
  const conditionFn = (data: unknown) => isObject(data) && data.active
  const data = { active: false }
  const state = {
    context: [],
    value: data,
  }

  const ret = ifelse(conditionFn, truePipeline)(options)(identity)(state)

  t.deepEqual(ret, state)
})

test('should run falsePipeline when no conditionFn', (t) => {
  const data = { active: true }
  const state = {
    context: [],
    value: data,
  }
  const expectedValue = { inactive: [data] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret = ifelse(undefined as any, truePipeline, falsePipeline)(options)(
    identity
  )(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should set primitive value', (t) => {
  const truePipeline = 'age'
  const conditionFn = (data: unknown) =>
    isObject(data) && typeof data.age === 'number'
  const data = { age: 32 }
  const state = {
    context: [],
    value: data,
  }
  const expected = {
    context: [],
    value: 32,
  }

  const ret = ifelse(conditionFn, truePipeline, falsePipeline)(options)(
    identity
  )(state)

  t.deepEqual(ret, expected)
})

test('should set primitive value in reverse', (t) => {
  const truePipeline = 'age'
  const conditionFn = (data: unknown) => typeof data === 'number'
  const data = 32
  const state = {
    context: [],
    value: data,
    rev: true,
  }
  const expected = {
    context: [],
    value: { age: 32 },
    rev: true,
  }

  const ret = ifelse(conditionFn, truePipeline, falsePipeline)(options)(
    identity
  )(state)

  t.deepEqual(ret, expected)
})

test('should run truePipeline with pipeline as condition', (t) => {
  const conditionPipeline = 'active'
  const data = { active: true }
  const state = {
    context: [],
    value: data,
  }
  const expected = {
    context: [],
    value: { active: [data] },
  }

  const ret = ifelse(conditionPipeline, truePipeline, falsePipeline)(options)(
    identity
  )(state)

  t.deepEqual(ret, expected)
})

test('should run falsePipeline with pipeline as condition', (t) => {
  const conditionPipeline = 'active'
  const data = { active: false }
  const state = {
    context: [],
    value: data,
  }
  const expectedValue = { inactive: [data] }

  const ret = ifelse(conditionPipeline, truePipeline, falsePipeline)(options)(
    identity
  )(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should run next only once', (t) => {
  const next = sinon.stub().returnsArg(0)
  const conditionFn = (data: unknown) => isObject(data) && data.active
  const data = { active: true }
  const state = {
    context: [],
    value: data,
  }

  ifelse(conditionFn, truePipeline, falsePipeline)(options)(next)(state)

  t.is(next.callCount, 1)
})
