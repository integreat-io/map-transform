import test from 'node:test'
import assert from 'node:assert/strict'

import State from './state.js'

// Tests

test('should create a new empty state', () => {
  const state = new State()

  assert.equal(state.value, undefined)
  assert.deepEqual(state.context, [])
  assert.equal(state.target, undefined)
  assert.deepEqual(state.nonvalues, [undefined])
  assert.ok(state.pipelines instanceof Map)
  assert.equal(state.pipelines.size, 0)
  assert.equal(state.rev, false)
  assert.equal(state.flip, false)
  assert.equal(state.noDefaults, false)
  assert.equal(state.index, undefined)
})

test('should create a new state with prefilled properties', () => {
  const target = { item: { id: 'ent1' } }
  const initialState = {
    target,
    nonvalues: [undefined, null],
    rev: true,
    noDefaults: true,
  }

  const state = new State(initialState)

  assert.equal(state.value, undefined)
  assert.deepEqual(state.context, [])
  assert.deepEqual(state.target, target)
  assert.deepEqual(state.nonvalues, [undefined, null])
  assert.ok(state.pipelines instanceof Map)
  assert.equal(state.pipelines.size, 0)
  assert.equal(state.rev, true)
  assert.equal(state.flip, false)
  assert.equal(state.noDefaults, true)
  assert.equal(state.index, undefined)
})

test('should clone context when creating state from prefilled values', () => {
  const context = [{ item: { id: 'ent1' } }]
  const initialState = { context }

  const state = new State(initialState)

  assert.deepEqual(state.context, context)
  assert.notEqual(state.context, context)
})

test('should pass on pipelines when creating state from prefilled values', () => {
  const pipelines = new Map()
  pipelines.set('items', ['items'])
  const initialState = { pipelines }

  const state = new State(initialState)

  assert.equal(state.pipelines, pipelines)
  assert.equal(state.pipelines.size, 1)
  assert.ok(state.pipelines.has('items'))
})

test('should accept a separate value when creating state', () => {
  const target = { item: { id: 'ent1' } }
  const initialState = {
    value: 'Not our',
    target,
    rev: true,
    noDefaults: true,
  }
  const value = 'Our value'

  const state = new State(initialState, value)

  assert.equal(state.value, 'Our value')
})

test('should accept undefined as a separate value', () => {
  const target = { item: { id: 'ent1' } }
  const initialState = {
    value: 'Not our',
    target,
    rev: true,
    noDefaults: true,
  }
  const value = undefined

  const state = new State(initialState, value)

  assert.equal(state.value, undefined)
})
