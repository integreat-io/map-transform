import test from 'ava'

import { value, fixed } from './value.js'

// Setup

const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Tests -- value

test('should return value', async (t) => {
  const data = undefined

  const ret = await value({ value: 'The default' })(options)(data, state)

  t.is(ret, 'The default')
})

test('should unescape value', async (t) => {
  const data = { something: 'new' }

  const ret = await value({ value: '**undefined**' })(options)(data, state)

  t.is(ret, undefined)
})

test('should return value from function', async (t) => {
  const data = undefined
  const valueFunction = () => 'Value from function'

  const ret = await value({ value: valueFunction })(options)(data, state)

  t.is(ret, 'Value from function')
})

test('should return value when not undefined', async (t) => {
  const data = { title: 'The data' }

  const ret = await value({ value: 'The default' })(options)(data, state)

  t.is(ret, 'The default')
})

test('should not return default value when noDefaults is true', async (t) => {
  const data = undefined
  const stateWithNoDefaults = { ...state, noDefaults: true }

  const ret = await value({ value: 'The default' })(options)(
    data,
    stateWithNoDefaults
  )

  t.is(ret, undefined)
})

test('should override pipeline value with undefined when noDefaults is true', async (t) => {
  const data = { title: 'Title 1' }
  const stateWithNoDefaults = { ...state, value: data, noDefaults: true }

  const ret = await value({ value: 'The default' })(options)(
    data,
    stateWithNoDefaults
  )

  t.is(ret, undefined)
})

test('should accept a non-object value provided as first argument instead of props', async (t) => {
  const data = undefined

  const ret = await value('The default')(options)(data, state)

  t.is(ret, 'The default')
})

// Tests -- fixed

test('should return fixed value', async (t) => {
  const data = undefined

  const ret = await fixed({ value: 'The default' })(options)(data, state)

  t.is(ret, 'The default')
})

test('should unescape fixed value', async (t) => {
  const data = { something: 'new' }

  const ret = await fixed({ value: '**undefined**' })(options)(data, state)

  t.is(ret, undefined)
})

test('should return fixed value from function', async (t) => {
  const data = undefined
  const valueFunction = () => 'Value from function'

  const ret = await fixed({ value: valueFunction })(options)(data, state)

  t.is(ret, 'Value from function')
})

test('should return fixed value also when noDefaults is true', async (t) => {
  const data = undefined
  const stateWithNoDefaults = { ...state, noDefaults: true }

  const ret = await fixed({ value: 'The default' })(options)(
    data,
    stateWithNoDefaults
  )

  t.is(ret, 'The default')
})

test('should return fixed value without object', async (t) => {
  const data = undefined

  const ret = await fixed('The default')(options)(data, state)

  t.is(ret, 'The default')
})
