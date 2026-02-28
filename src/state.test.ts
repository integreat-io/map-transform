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

// Tests -- root

test('should set root to value when created with a separate value', () => {
  const value = { id: 'ent1' }

  const state = new State({}, value)

  assert.deepEqual(state.root, value)
})

test('should keep root from initial state when provided', () => {
  const root = { id: 'original' }
  const value = { id: 'transformed' }

  const state = new State({ root }, value)

  assert.deepEqual(state.root, root)
})

test('should have undefined root when created without a separate value', () => {
  const state = new State()

  assert.equal(state.root, undefined)
})

test('should preserve root through forwardState', () => {
  const root = { id: 'original' }
  const state = new State({ root, rev: true }, 'value')
  const fwdState = state.forwardState()

  assert.deepEqual(fwdState.root, root)
})

test('should preserve root through revState', () => {
  const root = { id: 'original' }
  const state = new State({ root }, 'value')
  const revState = state.revState()

  assert.deepEqual(revState.root, root)
})

test('should preserve root through flipState', () => {
  const root = { id: 'original' }
  const state = new State({ root }, 'value')
  const flipped = state.flipState()

  assert.deepEqual(flipped.root, root)
})

// Tests -- isRev

test('should return true when rev', () => {
  const initialState = {
    rev: true,
    flip: false,
  }

  const state = new State(initialState)
  const ret = state.isRev

  assert.equal(ret, true)
})

test('should return false when fwd', () => {
  const initialState = {
    rev: false,
    flip: false,
  }

  const state = new State(initialState)
  const ret = state.isRev

  assert.equal(ret, false)
})

test('should return true when forward and flipped', () => {
  const initialState = {
    rev: false,
    flip: true,
  }

  const state = new State(initialState)
  const ret = state.isRev

  assert.equal(ret, true)
})

test('should return false when reverse and flipped', () => {
  const initialState = {
    rev: true,
    flip: true,
  }

  const state = new State(initialState)
  const ret = state.isRev

  assert.equal(ret, false)
})

// Tests -- forwardState()

test('should create a new forward state', () => {
  const target = { item: { id: 'ent1' } }
  const initialState = {
    target,
    nonvalues: [undefined, null],
    rev: true,
    flip: true,
    noDefaults: true,
  }

  const state = new State(initialState)
  const fwdState = state.forwardState()

  assert.equal(fwdState.rev, false)
  assert.equal(fwdState.flip, false)
  assert.equal(fwdState.value, undefined)
  assert.deepEqual(fwdState.context, [])
  assert.deepEqual(fwdState.target, target)
  assert.deepEqual(fwdState.nonvalues, [undefined, null])
  assert.ok(fwdState.pipelines instanceof Map)
  assert.equal(fwdState.pipelines.size, 0)
  assert.equal(fwdState.noDefaults, true)
  assert.equal(fwdState.index, undefined)
})

// Tests -- revState()

test('should create a new reverse state', () => {
  const target = { item: { id: 'ent1' } }
  const initialState = {
    target,
    nonvalues: [undefined, null],
    rev: false,
    flip: true,
    noDefaults: true,
  }

  const state = new State(initialState)
  const revState = state.revState()

  assert.equal(revState.rev, true)
  assert.equal(revState.flip, false)
  assert.equal(revState.value, undefined)
  assert.deepEqual(revState.context, [])
  assert.deepEqual(revState.target, target)
  assert.deepEqual(revState.nonvalues, [undefined, null])
  assert.ok(revState.pipelines instanceof Map)
  assert.equal(revState.pipelines.size, 0)
  assert.equal(revState.noDefaults, true)
  assert.equal(revState.index, undefined)
})

// Tests -- flipState()

test('should create a new flipped state', () => {
  const target = { item: { id: 'ent1' } }
  const initialState = {
    target,
    nonvalues: [undefined, null],
    rev: false,
    flip: false,
    noDefaults: true,
  }

  const state = new State(initialState)
  const revState = state.flipState()

  assert.equal(revState.rev, false)
  assert.equal(revState.flip, true)
  assert.equal(revState.value, undefined)
  assert.deepEqual(revState.context, [])
  assert.deepEqual(revState.target, target)
  assert.deepEqual(revState.nonvalues, [undefined, null])
  assert.ok(revState.pipelines instanceof Map)
  assert.equal(revState.pipelines.size, 0)
  assert.equal(revState.noDefaults, true)
  assert.equal(revState.index, undefined)
})

test('should create a new flipped state when flipped', () => {
  const target = { item: { id: 'ent1' } }
  const initialState = {
    target,
    nonvalues: [undefined, null],
    rev: false,
    flip: true,
    noDefaults: true,
  }

  const state = new State(initialState)
  const revState = state.flipState()

  assert.equal(revState.rev, false)
  assert.equal(revState.flip, false)
  assert.equal(revState.value, undefined)
  assert.deepEqual(revState.context, [])
  assert.deepEqual(revState.target, target)
  assert.deepEqual(revState.nonvalues, [undefined, null])
  assert.ok(revState.pipelines instanceof Map)
  assert.equal(revState.pipelines.size, 0)
  assert.equal(revState.noDefaults, true)
  assert.equal(revState.index, undefined)
})
