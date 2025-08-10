import test from 'node:test'
import assert from 'node:assert/strict'
import State from './state.js'
import type { Path } from './types.js'

import createPathMapper, { pathGetter, pathSetter } from './createPathMapper.js'

// Setup

const state = new State()
const stateRev = new State({ rev: true })

// Tests -- path mapper

test('should create path mapper', () => {
  const path = 'data.items'

  const ret = createPathMapper(path)

  assert.equal(typeof ret, 'function')
})

test('should get path', () => {
  const path = 'data.items'
  const value = { data: { items: [{ id: 'ent1' }] } }
  const expected = [{ id: 'ent1' }]

  const ret = createPathMapper(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should get with dot path', () => {
  const path = '.'
  const value = { id: 'ent1' }
  const expected = { id: 'ent1' }

  const ret = createPathMapper(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should get with no path', () => {
  const path = null
  const value = { id: 'ent1' }
  const expected = { id: 'ent1' }

  const ret = createPathMapper(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should get path with array index', () => {
  const path = 'data.items[1]'
  const value = { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } }
  const expected = { id: 'ent2' }

  const ret = createPathMapper(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should get path with negative array index', () => {
  const path = 'data.items[-2]'
  const value = { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } }
  const expected = { id: 'ent1' }

  const ret = createPathMapper(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should get with parent', () => {
  const path = '^.items'
  const context = [{ items: [{ id: 'ent1' }] }]
  const state = new State({ context })
  const value = 'Some other value'
  const expected = [{ id: 'ent1' }]

  const ret = createPathMapper(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should set path', () => {
  const path = '>data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = createPathMapper(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should set path in reverse', () => {
  const path = 'data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = createPathMapper(path)(value, stateRev)

  assert.deepEqual(ret, expected)
})

test('should throw when given an array def', () => {
  const path = ['data', 'items']
  const expectedError = new Error('The path mapper only accepts a path string')

  assert.throws(() => createPathMapper(path as unknown as Path), expectedError) // Force type as this we're testing an invalid argument
})

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

test('should throw when getter is given an array def', () => {
  const path = ['data', 'items']
  const expectedError = new Error('The path getter only accepts a path string')

  assert.throws(() => pathGetter(path as unknown as Path), expectedError) // Force type as this we're testing an invalid argument
})

// Tests -- path setter

test('should set path with setter', () => {
  const path = 'data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = pathSetter(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should set path with setter when the path is already a set path', () => {
  const path = '>data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = pathSetter(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should set path with setter when the path has a get prefix', () => {
  const path = '<data.items'
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

test('should throw when setter is given an array def', () => {
  const path = ['data', 'items']
  const expectedError = new Error('The path setter only accepts a path string')

  assert.throws(() => pathSetter(path as unknown as Path), expectedError) // Force type as this we're testing an invalid argument
})
