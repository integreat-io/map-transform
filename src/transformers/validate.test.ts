import test from 'ava'

import validate from './validate.js'

// Setup

const state = {
  rev: false,
  onlyMapped: false,
  context: [],
  value: {},
}

const options = {}

// Test

test('should return true when value at path validates', (t) => {
  const schema = { type: 'string' }
  const path = 'item.value'
  const data = { item: { value: 'theValue' } }

  const ret = validate({ path, schema }, options)(data, state)

  t.true(ret)
})

test('should return false when value at path fails validation', (t) => {
  const schema = { type: 'string' }
  const path = 'item.value'
  const data = { item: { value: 3 } }

  const ret = validate({ path, schema }, options)(data, state)

  t.false(ret)
})

test('should validate entiry array', (t) => {
  const schema = { type: 'array' }
  const path = 'item.value'
  const data = { item: { value: ['firstValue', 'secondValue'] } }

  const ret = validate({ path, schema }, options)(data, state)

  t.true(ret)
})

test('should validate entiry array items according to json schema sec', (t) => {
  const schema = { items: { type: 'string' }, type: 'array' }
  const path = 'item.value'
  const data = { item: { value: ['firstValue', 'secondValue'] } }

  const ret = validate({ path, schema }, options)(data, state)

  t.true(ret)
})

test('should return false when path does not exist on data', (t) => {
  const schema = { type: 'string' }
  const path = 'item.value'
  const data = {}

  const ret = validate({ path, schema }, options)(data, state)

  t.false(ret)
})

test('should return true for non-existing path when schema still validates', (t) => {
  const schema = {}
  const path = 'item.value'
  const data = {}

  const ret = validate({ path, schema }, options)(data, state)

  t.true(ret)
})
