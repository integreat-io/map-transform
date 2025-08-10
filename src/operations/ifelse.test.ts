import test from 'node:test'
import assert from 'node:assert/strict'
import sinon from 'sinon'
import { isObject } from '../utils/is.js'
import { set } from './getSet.js'
import { noopNext } from '../utils/stateHelpers.js'

import ifelse from './ifelse.js'

// Setup

const options = {}

const truePipeline = set('active[]')
const falsePipeline = set('inactive[]')

// Tests

test('should run truePipeline when true', async () => {
  const conditionFn = async (data: unknown) => isObject(data) && data.active
  const data = { active: true }
  const state = {
    context: [],
    value: data,
  }
  const expected = {
    context: [],
    value: { active: [data] },
  }

  const ret = await ifelse(conditionFn, truePipeline, falsePipeline)(options)(
    noopNext,
  )(state)

  assert.deepEqual(ret, expected)
})

test('should run falsePipeline when false', async () => {
  const conditionFn = async (data: unknown) => isObject(data) && data.active
  const data = { active: false }
  const state = {
    context: [],
    value: data,
  }
  const expectedValue = { inactive: [data] }

  const ret = await ifelse(conditionFn, truePipeline, falsePipeline)(options)(
    noopNext,
  )(state)

  assert.deepEqual(ret.value, expectedValue)
})

test('should do nothing when true and no truePipeline', async () => {
  const conditionFn = async (data: unknown) => isObject(data) && data.active
  const data = { active: true }
  const state = {
    context: [],
    value: data,
  }

  const ret = await ifelse(conditionFn, undefined, falsePipeline)(options)(
    noopNext,
  )(state)

  assert.deepEqual(ret, state)
})

test('should do nothing when false and no falsePipeline', async () => {
  const conditionFn = async (data: unknown) => isObject(data) && data.active
  const data = { active: false }
  const state = {
    context: [],
    value: data,
  }

  const ret = await ifelse(conditionFn, truePipeline)(options)(noopNext)(state)

  assert.deepEqual(ret, state)
})

test('should run falsePipeline when no conditionFn', async () => {
  const data = { active: true }
  const state = {
    context: [],
    value: data,
  }
  const expectedValue = { inactive: [data] }

  const ret = await ifelse(undefined, truePipeline, falsePipeline)(options)(
    noopNext,
  )(state)

  assert.deepEqual(ret.value, expectedValue)
})

test('should set primitive value', async () => {
  const truePipeline = 'age'
  const conditionFn = async (data: unknown) =>
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

  const ret = await ifelse(conditionFn, truePipeline, falsePipeline)(options)(
    noopNext,
  )(state)

  assert.deepEqual(ret, expected)
})

test('should set primitive value in reverse', async () => {
  const truePipeline = 'age'
  const conditionFn = async (data: unknown) => typeof data === 'number'
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

  const ret = await ifelse(conditionFn, truePipeline, falsePipeline)(options)(
    noopNext,
  )(state)

  assert.deepEqual(ret, expected)
})

test('should run truePipeline with pipeline as condition', async () => {
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

  const ret = await ifelse(
    conditionPipeline,
    truePipeline,
    falsePipeline,
  )(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should run falsePipeline with pipeline as condition', async () => {
  const conditionPipeline = 'active'
  const data = { active: false }
  const state = {
    context: [],
    value: data,
  }
  const expectedValue = { inactive: [data] }

  const ret = await ifelse(
    conditionPipeline,
    truePipeline,
    falsePipeline,
  )(options)(noopNext)(state)

  assert.deepEqual(ret.value, expectedValue)
})

test('should run next only once', async () => {
  const next = sinon.stub().returnsArg(0)
  const conditionFn = async (data: unknown) => isObject(data) && data.active
  const data = { active: true }
  const state = {
    context: [],
    value: data,
  }

  await ifelse(conditionFn, truePipeline, falsePipeline)(options)(next)(state)

  assert.equal(next.callCount, 1)
})
