import test from 'node:test'
import assert from 'node:assert/strict'

import { pathGetter, pathSetter } from './createPathMapper.js'

// Setup

const state = { context: [], value: undefined }
const stateRev = { context: [], value: undefined, rev: true }

// Tests -- path getter

test('should get path with getter', async () => {
  const path = 'data.items'
  const value = { data: { items: [{ id: 'ent1' }] } }
  const expected = [{ id: 'ent1' }]

  const ret = await pathGetter(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should get path with getter in reverse too', async () => {
  const path = 'data.items'
  const value = { data: { items: [{ id: 'ent1' }] } }
  const expected = [{ id: 'ent1' }]

  const ret = await pathGetter(path)(value, stateRev)

  assert.deepEqual(ret, expected)
})

// Tests -- path setter

test('should set path with setter', async () => {
  const path = 'data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = await pathSetter(path)(value, state)

  assert.deepEqual(ret, expected)
})

test('should set path with setter in reverse too', async () => {
  const path = 'data.items'
  const value = [{ id: 'ent1' }]
  const expected = { data: { items: [{ id: 'ent1' }] } }

  const ret = await pathSetter(path)(value, stateRev)

  assert.deepEqual(ret, expected)
})
