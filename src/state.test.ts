import test from 'ava'

import State from './state.js'

// Tests

test('should create a new empty state', (t) => {
  const state = new State()

  t.is(state.value, undefined)
  t.deepEqual(state.context, [])
  t.is(state.target, undefined)
  t.deepEqual(state.nonvalues, [undefined])
  t.true(state.pipelines instanceof Map)
  t.is(state.pipelines.size, 0)
  t.is(state.rev, false)
  t.is(state.flip, false)
  t.is(state.noDefaults, false)
  t.is(state.index, undefined)
})

test('should create a new state with prefilled properties', (t) => {
  const target = { item: { id: 'ent1' } }
  const initialState = {
    target,
    nonvalues: [undefined, null],
    rev: true,
    noDefaults: true,
  }

  const state = new State(initialState)

  t.is(state.value, undefined)
  t.deepEqual(state.context, [])
  t.deepEqual(state.target, target)
  t.deepEqual(state.nonvalues, [undefined, null])
  t.true(state.pipelines instanceof Map)
  t.is(state.pipelines.size, 0)
  t.is(state.rev, true)
  t.is(state.flip, false)
  t.is(state.noDefaults, true)
  t.is(state.index, undefined)
})

test('should clone context when creating state from prefilled values', (t) => {
  const context = [{ item: { id: 'ent1' } }]
  const initialState = { context }

  const state = new State(initialState)

  t.deepEqual(state.context, context)
  t.not(state.context, context)
})

test('should pass on pipelines when creating state from prefilled values', (t) => {
  const pipelines = new Map()
  pipelines.set('items', ['items'])
  const initialState = { pipelines }

  const state = new State(initialState)

  t.is(state.pipelines, pipelines)
  t.is(state.pipelines.size, 1)
  t.true(state.pipelines.has('items'))
})

test('should accept a separate value when creating state', (t) => {
  const target = { item: { id: 'ent1' } }
  const initialState = {
    value: 'Not our',
    target,
    rev: true,
    noDefaults: true,
  }
  const value = 'Our value'

  const state = new State(initialState, value)

  t.is(state.value, 'Our value')
})

test('should accept undefined as a separate value', (t) => {
  const target = { item: { id: 'ent1' } }
  const initialState = {
    value: 'Not our',
    target,
    rev: true,
    noDefaults: true,
  }
  const value = undefined

  const state = new State(initialState, value)

  t.is(state.value, undefined)
})

test('should push to context', (t) => {
  const state = new State()
  const expected = [{ item: { id: 'ent1' } }, { id: 'ent1' }]

  state.pushContext({ item: { id: 'ent1' } })
  state.pushContext({ id: 'ent1' })

  t.deepEqual(state.context, expected)
})

test('should pop from context', (t) => {
  const state = new State()
  state.pushContext({ item: { id: 'ent1' } })
  state.pushContext({ id: 'ent1' })
  const expectedValue = { id: 'ent1' }
  const expectedContext = [{ item: { id: 'ent1' } }]

  const ret = state.popContext()

  t.deepEqual(ret, expectedValue)
  t.deepEqual(state.context, expectedContext)
})

test('should replace context', (t) => {
  const state = new State()
  state.pushContext({ item: { id: 'ent1' } })
  const context = [{ id: 'ent1' }]

  state.replaceContext(context)

  t.is(state.context, context)
})

test('should clear context', (t) => {
  const state = new State()
  state.pushContext({ item: { id: 'ent1' } })
  const expected: unknown[] = []

  state.clearContext()

  t.deepEqual(state.context, expected)
})
