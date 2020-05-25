import test from 'ava'
import value from './value'

import modify from './modify'

// Setup

const options = {}

// Tests

test('should shallow merge original data with mapped data', t => {
  const pipeline = { data: 'data.items' }
  const items = [{ id: 'ent1', $type: 'entry' }]
  const state = {
    root: { status: 'ok', data: { items } },
    context: { status: 'ok', data: { items } },
    value: { status: 'ok', data: { items } }
  }
  const expected = {
    ...state,
    value: { status: 'ok', data: items }
  }

  const ret = modify(pipeline)(options)(state)

  t.deepEqual(ret, expected)
})

// TODO: Implement for arrays too
test.skip('should modify array item', t => {
  const pipeline = [value(true), '[1].added']
  const items = [{ id: 'ent1', $type: 'entry' }]
  const state = {
    root: items,
    context: items,
    value: items
  }
  const expected = {
    ...state,
    value: [...items, { added: true }]
  }

  const ret = modify(pipeline)(options)(state)

  t.deepEqual(ret, expected)
})

test('should return mapped value when not an object', t => {
  const pipeline = 'data.value'
  const value = 32
  const state = {
    root: { status: 'ok', data: { value } },
    context: { status: 'ok', data: { value } },
    value: { status: 'ok', data: { value } }
  }
  const expected = {
    ...state,
    value
  }

  const ret = modify(pipeline)(options)(state)

  t.deepEqual(ret, expected)
})

test('should return mapped object when original was not an object', t => {
  const pipeline = { data: '.' }
  const value = 32
  const state = {
    root: { status: 'ok', data: { value } },
    context: value,
    value: value
  }
  const expected = {
    ...state,
    value: { data: value }
  }

  const ret = modify(pipeline)(options)(state)

  t.deepEqual(ret, expected)
})

test('should not mutate undefined', t => {
  const pipeline = { data: '.' }
  const value = undefined
  const state = {
    root: { status: 'ok', data: { value } },
    context: value,
    value: value
  }
  const expected = {
    ...state,
    value: undefined
  }

  const ret = modify(pipeline)(options)(state)

  t.deepEqual(ret, expected)
})

test('should honor mutateNull', t => {
  const options = { mutateNull: false }
  const pipeline = { data: '.' }
  const value = null
  const state = {
    root: { status: 'ok', data: { value } },
    context: value,
    value: value
  }
  const expected = {
    ...state,
    value: undefined
  }

  const ret = modify(pipeline)(options)(state)

  t.deepEqual(ret, expected)
})
