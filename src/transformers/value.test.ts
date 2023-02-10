import test from 'ava'

import { value, fixed } from './value.js'

// Setup

const state = {
  rev: false,
  onlyMapped: false,
  context: [],
  value: {},
}

// Tests -- value

test('should return value', (t) => {
  const data = undefined

  const ret = value({ value: 'The default' })(data, state)

  t.is(ret, 'The default')
})

test('should unescape value', (t) => {
  const data = { something: 'new' }

  const ret = value({ value: '**undefined**' })(data, state)

  t.is(ret, undefined)
})

test('should return value from function', (t) => {
  const data = undefined
  const valueFunction = () => 'Value from function'

  const ret = value({ value: valueFunction })(data, state)

  t.is(ret, 'Value from function')
})

test('should return value when not undefined', (t) => {
  const data = { title: 'The data' }

  const ret = value({ value: 'The default' })(data, state)

  t.is(ret, 'The default')
})

test('should not return default value when onlyMapped is true', (t) => {
  const data = undefined
  const contextonlyMapped = { ...state, onlyMapped: true }

  const ret = value({ value: 'The default' })(data, contextonlyMapped)

  t.is(ret, undefined)
})

test('should return value given without object', (t) => {
  const data = undefined

  const ret = value('The default')(data, state)

  t.is(ret, 'The default')
})

// Tests -- fixed

test('should return fixed value', (t) => {
  const data = undefined

  const ret = fixed({ value: 'The default' })(data, state)

  t.is(ret, 'The default')
})

test('should unescape fixed value', (t) => {
  const data = { something: 'new' }

  const ret = fixed({ value: '**undefined**' })(data, state)

  t.is(ret, undefined)
})

test('should return fixed value from function', (t) => {
  const data = undefined
  const valueFunction = () => 'Value from function'

  const ret = fixed({ value: valueFunction })(data, state)

  t.is(ret, 'Value from function')
})

test('should return fixed value also when onlyMapped is true', (t) => {
  const data = undefined
  const contextonlyMapped = { ...state, onlyMapped: true }

  const ret = fixed({ value: 'The default' })(data, contextonlyMapped)

  t.is(ret, 'The default')
})

test('should return fixed value without object', (t) => {
  const data = undefined

  const ret = fixed('The default')(data, state)

  t.is(ret, 'The default')
})
