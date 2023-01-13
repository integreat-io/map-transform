import test from 'ava'
import { defsToDataMapper } from '../utils/definitionHelpers.js'

import template from './template.js'

// Setup

const state = {
  rev: false,
  onlyMapped: false,
  context: [],
  value: {},
}

const options = { defsToDataMapper }

// Tests

test('should apply template', (t) => {
  const operands = { template: '{{description}}. By {{artist}}' }
  const data = {
    description: 'Bergen by night',
    artist: 'John F.',
  }
  const expected = 'Bergen by night. By John F.'

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test('should apply template several times', (t) => {
  const operands = { template: '{{description}}. By {{artist}}' }
  const data0 = {
    description: 'Bergen by night',
    artist: 'John F.',
  }
  const data1 = {
    description: 'Mona Lisa',
    artist: 'Leonardo d.',
  }
  const expected0 = 'Bergen by night. By John F.'
  const expected1 = 'Mona Lisa. By Leonardo d.'

  const ret0 = template(operands, options)(data0, state)
  const ret1 = template(operands, options)(data1, state)

  t.is(ret0, expected0)
  t.is(ret1, expected1)
})

test('should apply template from path', (t) => {
  const operands = { templatePath: 'captionTemplate' }
  const data = {
    description: 'Bergen by night',
    artist: 'John F.',
    captionTemplate: '{{description}}. By {{artist}}',
  }
  const expected = 'Bergen by night. By John F.'

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test('should return undefined when no template at path', (t) => {
  const operands = { templatePath: 'captionTemplate' }
  const data = {
    description: 'Bergen by night',
    artist: 'John F.',
  }
  const expected = undefined

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test('should apply template to array', (t) => {
  const operands = { template: '{{description}}. By {{artist}}' }
  const data = [
    {
      description: 'Bergen by night',
      artist: 'John F.',
    },
    {
      description: 'Water Lilies',
      artist: 'Monet',
    },
  ]
  const expected = ['Bergen by night. By John F.', 'Water Lilies. By Monet']

  const ret = template(operands, options)(data, state)

  t.deepEqual(ret, expected)
})

test('should leave missing fields empty', (t) => {
  const operands = { template: '{{description}}. By {{artist}}' }
  const data = {
    description: 'Bergen by night',
  }
  const expected = 'Bergen by night. By '

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test('should force values to string', (t) => {
  const operands = { template: '{{description}}. By {{artist}}' }
  const data = {
    description: 'Bergen by night',
    artist: { id: 'johnf' },
  }
  const expected = 'Bergen by night. By [object Object]'

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test('should support dot notation paths', (t) => {
  const operands = { template: '{{description}}. By {{meta.artist}}' }
  const data = {
    description: 'Bergen by night',
    meta: { artist: 'John F.' },
  }
  const expected = 'Bergen by night. By John F.'

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test('should support a single dot as path', (t) => {
  const operands = { template: 'The title: {{.}}' }
  const data = 'Bergen by night'
  const expected = 'The title: Bergen by night'

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test('should apply uri encoded template', (t) => {
  const operands = {
    template: '/production?query={{{query}}}&%24table=%22{{{tableId}}}%22',
  }
  const data = {
    query:
      "*%5B_type%3D%3D'table'%26%26key%3D%3D%24table%5D%5B0%5D.fields%7Bkey%2Cname%2Ctype%7D",
    tableId: 'orders',
  }
  const expected =
    "/production?query=*%5B_type%3D%3D'table'%26%26key%3D%3D%24table%5D%5B0%5D.fields%7Bkey%2Cname%2Ctype%7D&%24table=%22orders%22"

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test('should use template without placeholders', (t) => {
  const operands = { template: 'A string!' }
  const data = {
    description: 'Bergen by night',
    artist: 'John F.',
  }
  const expected = 'A string!'

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test('should use string instead of operands as template', (t) => {
  const operands = '{{description}}. By {{artist}}'
  const data = {
    description: 'Bergen by night',
    artist: 'John F.',
  }
  const expected = 'Bergen by night. By John F.'

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test('should return undefined when no template', (t) => {
  const operands = {}
  const data = {
    description: 'Bergen by night',
    artist: 'John F.',
  }
  const expected = undefined

  const ret = template(operands, options)(data, state)

  t.is(ret, expected)
})

test.todo('should get with root template path')
