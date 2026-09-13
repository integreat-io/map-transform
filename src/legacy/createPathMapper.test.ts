import test from 'node:test'
import assert from 'node:assert/strict'

import { pathGetter, pathSetter } from './createPathMapper.js'

// Setup

const state = { context: [], value: undefined }
const stateRev = { context: [], value: undefined, rev: true }

// Tests -- path getter

test('should get path with getter', () => {
  const path = 'data.items'
  const value = { data: { items: [{ id: 'ent1' }] } }
  const expected = [{ id: 'ent1' }]

  const ret = pathGetter(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should get path with getter in reverse too', () => {
  const path = 'data.items'
  const value = { data: { items: [{ id: 'ent1' }] } }
  const expected = [{ id: 'ent1' }]

  const ret = pathGetter(path)(value, stateRev)

  assert.deepEqual(ret, expected)
})

// Tests -- path setter

test('should set path with setter', () => {
  const path = 'data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = pathSetter(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should set path with setter in reverse too', () => {
  const path = 'data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = pathSetter(path)(value, stateRev)

  assert.deepEqual(ret, expected)
})

test('should get path with parent', () => {
  const path = '^.meta.field'
  const value = { name: 'Bohm' }
  const state = {
    context: [
      { data: { scientist: { name: 'Bohm' }, meta: { field: 'physics' } } },
      { scientist: { name: 'Bohm' }, meta: { field: 'physics' } },
    ],
    value,
  }
  const expected = 'physics'

  const ret = pathGetter(path)(value, state)

  assert.equal(ret, expected)
})

test('should get path with root', () => {
  const path = '^^.page'
  const value = { name: 'Bohm' }
  const state = {
    context: [
      { data: { scientist: { name: 'Bohm' } }, page: 0 },
      { scientist: { name: 'Bohm' } },
    ],
    value,
  }
  const expected = 0

  const ret = pathGetter(path)(value, state)

  assert.equal(ret, expected)
})

test('should support obsolete root notation with one carret', () => {
  const path = '^page'
  const value = { name: 'Bohm' }
  const state = {
    context: [
      { data: { scientist: { name: 'Bohm' } }, page: 0 },
      { scientist: { name: 'Bohm' } },
    ],
    value,
  }
  const expected = 0

  const ret = pathGetter(path)(value, state)

  assert.equal(ret, expected)
})

test('should support obsolete root notation with one carret and get prefix', () => {
  const path = '<^page'
  const value = { name: 'Bohm' }
  const state = {
    context: [
      { data: { scientist: { name: 'Bohm' } }, page: 0 },
      { scientist: { name: 'Bohm' } },
    ],
    value,
  }
  const expected = 0

  const ret = pathGetter(path)(value, state)

  assert.equal(ret, expected)
})

test('should not set when parent path', () => {
  const path = '^.meta.field'
  const value = 'physics'
  const expected = undefined

  const ret = pathSetter(path)(value, state)

  assert.equal(ret, expected)
})

test('should not set with root path', () => {
  const path = '^^.page'
  const value = 0
  const expected = undefined

  const ret = pathSetter(path)(value, state)

  assert.equal(ret, expected)
})

test('should not set with obsolete root path', () => {
  const path = '^page'
  const value = 0
  const expected = undefined

  const ret = pathSetter(path)(value, state)

  assert.equal(ret, expected)
})
