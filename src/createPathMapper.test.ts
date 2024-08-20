import test from 'ava'
import State from './state.js'
import type { Path } from './types.js'

import createPathMapper, { pathGetter, pathSetter } from './createPathMapper.js'

// Setup

const state = new State()
const stateRev = new State({ rev: true })

// Tests -- path mapper

test('should create path mapper', (t) => {
  const path = 'data.items'

  const ret = createPathMapper(path)

  t.is(typeof ret, 'function')
})

test('should get path', (t) => {
  const path = 'data.items'
  const value = { data: { items: [{ id: 'ent1' }] } }
  const expected = [{ id: 'ent1' }]

  const ret = createPathMapper(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should get with dot path', (t) => {
  const path = '.'
  const value = { id: 'ent1' }
  const expected = { id: 'ent1' }

  const ret = createPathMapper(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should get with no path', (t) => {
  const path = null
  const value = { id: 'ent1' }
  const expected = { id: 'ent1' }

  const ret = createPathMapper(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should get path with array index', (t) => {
  const path = 'data.items[1]'
  const value = { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } }
  const expected = { id: 'ent2' }

  const ret = createPathMapper(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should get path with negative array index', (t) => {
  const path = 'data.items[-2]'
  const value = { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } }
  const expected = { id: 'ent1' }

  const ret = createPathMapper(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should get with parent', (t) => {
  const path = '^.items'
  const context = [{ items: [{ id: 'ent1' }] }]
  const state = new State({ context })
  const value = 'Some other value'
  const expected = [{ id: 'ent1' }]

  const ret = createPathMapper(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should set path', (t) => {
  const path = '>data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = createPathMapper(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should set path in reverse', (t) => {
  const path = 'data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = createPathMapper(path)(value, stateRev)

  t.deepEqual(ret, expected)
})

test('should throw when given an array def', (t) => {
  const path = ['data', 'items']

  const error = t.throws(() => createPathMapper(path as unknown as Path)) // Force type as this we're testing an invalid argument

  t.true(error instanceof Error)
  t.is(error.message, 'The path mapper only accepts a path string')
})

// Tests -- path getter

test('should get path with getter', (t) => {
  const path = 'data.items'
  const value = { data: { items: [{ id: 'ent1' }] } }
  const expected = [{ id: 'ent1' }]

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should get path with getter in reverse too', (t) => {
  const path = 'data.items'
  const value = { data: { items: [{ id: 'ent1' }] } }
  const expected = [{ id: 'ent1' }]

  const ret = pathGetter(path)(value, stateRev)

  t.deepEqual(ret, expected)
})

test('should throw when getter is given an array def', (t) => {
  const path = ['data', 'items']

  const error = t.throws(() => pathGetter(path as unknown as Path)) // Force type as this we're testing an invalid argument

  t.true(error instanceof Error)
  t.is(error.message, 'The path getter only accepts a path string')
})

// Tests -- path setter

test('should set path with setter', (t) => {
  const path = 'data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should set path with setter when the path is already a set path', (t) => {
  const path = '>data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should set path with setter when the path has a get prefix', (t) => {
  const path = '<data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('should set path with setter in reverse too', (t) => {
  const path = 'data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = pathSetter(path)(value, stateRev)

  t.deepEqual(ret, expected)
})

test('should throw when setter is given an array def', (t) => {
  const path = ['data', 'items']

  const error = t.throws(() => pathSetter(path as unknown as Path)) // Force type as this we're testing an invalid argument

  t.true(error instanceof Error)
  t.is(error.message, 'The path setter only accepts a path string')
})
