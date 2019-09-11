import test from 'ava'

import template from './template'

// Tests

test('should apply template', t => {
  const operands = { template: '{{description}}. By {{artist}}' }
  const data = {
    description: 'Bergen by night',
    artist: 'John F.'
  }
  const expected = 'Bergen by night. By John F.'

  const ret = template(operands)(data)

  t.is(ret, expected)
})

test('should apply template to array', t => {
  const operands = { template: '{{description}}. By {{artist}}' }
  const data = [
    {
      description: 'Bergen by night',
      artist: 'John F.'
    },
    {
      description: 'Water Lilies',
      artist: 'Monet'
    }
  ]
  const expected = ['Bergen by night. By John F.', 'Water Lilies. By Monet']

  const ret = template(operands)(data)

  t.deepEqual(ret, expected)
})

test('should leave missing fields empty', t => {
  const operands = { template: '{{description}}. By {{artist}}' }
  const data = {
    description: 'Bergen by night'
  }
  const expected = 'Bergen by night. By '

  const ret = template(operands)(data)

  t.is(ret, expected)
})

test('should force values to string', t => {
  const operands = { template: '{{description}}. By {{artist}}' }
  const data = {
    description: 'Bergen by night',
    artist: { id: 'johnf' }
  }
  const expected = 'Bergen by night. By [object Object]'

  const ret = template(operands)(data)

  t.is(ret, expected)
})

test('should support dot notation paths', t => {
  const operands = { template: '{{description}}. By {{meta.artist}}' }
  const data = {
    description: 'Bergen by night',
    meta: { artist: 'John F.' }
  }
  const expected = 'Bergen by night. By John F.'

  const ret = template(operands)(data)

  t.is(ret, expected)
})

test('should support a single dot as path', t => {
  const operands = { template: 'The title: {{.}}' }
  const data = 'Bergen by night'
  const expected = 'The title: Bergen by night'

  const ret = template(operands)(data)

  t.is(ret, expected)
})

test('should use template without placeholders', t => {
  const operands = { template: 'A string!' }
  const data = {
    description: 'Bergen by night',
    artist: 'John F.'
  }
  const expected = 'A string!'

  const ret = template(operands)(data)

  t.is(ret, expected)
})

test('should use string instead of operands as template', t => {
  const operands = '{{description}}. By {{artist}}'
  const data = {
    description: 'Bergen by night',
    artist: 'John F.'
  }
  const expected = 'Bergen by night. By John F.'

  const ret = template(operands)(data)

  t.is(ret, expected)
})

test('should return undefined when no template', t => {
  const operands = {}
  const data = {
    description: 'Bergen by night',
    artist: 'John F.'
  }
  const expected = undefined

  const ret = template(operands)(data)

  t.is(ret, expected)
})
