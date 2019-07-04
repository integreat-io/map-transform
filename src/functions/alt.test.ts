import test from 'ava'

import alt from './alt'

test('should return default value when data is undefined', t => {
  const data = undefined

  const ret = alt({ value: 'The default' })(data)

  t.is(ret, 'The default')
})

test('should return data when not undefined', t => {
  const data = { title: 'The data' }

  const ret = alt({ value: 'The default' })(data)

  t.is(ret, data)
})

test('should return data when null', t => {
  const data = null

  const ret = alt({ value: 'The default' })(data)

  t.is(ret, data)
})

test('should not return default value when onlyMappedValues is true', t => {
  const data = undefined
  const context = { onlyMappedValues: true, rev: false }

  const ret = alt({ value: 'The default' })(data, context)

  t.is(typeof ret, 'undefined')
})
