import test from 'ava'

import { value, fixed } from './value'

test('should return value', t => {
  const data = undefined

  const ret = value({ value: 'The default' })(data)

  t.is(ret, 'The default')
})

test('should return value when not undefined', t => {
  const data = { title: 'The data' }

  const ret = value({ value: 'The default' })(data)

  t.is(ret, 'The default')
})

test('should not return default value when onlyMappedValues is true', t => {
  const data = undefined
  const context = { onlyMappedValues: true, rev: false }

  const ret = value({ value: 'The default' })(data, context)

  t.is(typeof ret, 'undefined')
})

test('should return fixed value', t => {
  const data = undefined

  const ret = fixed({ value: 'The default' })(data)

  t.is(ret, 'The default')
})

test('should return fixed value also when onlyMappedValues is true', t => {
  const data = undefined
  const context = { onlyMappedValues: true, rev: false }

  const ret = fixed({ value: 'The default' })(data, context)

  t.is(ret, 'The default')
})

test('should return value given without object', t => {
  const data = undefined

  const ret = value('The default')(data)

  t.is(ret, 'The default')
})

test('should return fixed value without object', t => {
  const data = undefined

  const ret = fixed('The default')(data)

  t.is(ret, 'The default')
})
