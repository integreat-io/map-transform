import test from 'ava'
import { Operands } from '../types'

import { mapTransform, rev } from '..'

// Setup

const operations = {
  float: (val: any, { precision = undefined }: Operands) => {
    const num = Number.parseFloat(val)
    return (Number.isNaN(num)) ? undefined : (typeof precision === 'undefined')
      ? num : Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision)
  }
}

// Tests

test('should map with operation object', (t) => {
  const def = {
    id: ['id'],
    orderTotal: ['total', { $op: 'float' }]
  }
  const data = {
    id: '12345',
    total: '128.1844321'
  }
  const expected = {
    id: '12345',
    orderTotal: 128.1844321
  }

  const ret = mapTransform(def, { operations })(data)

  t.deepEqual(ret, expected)
})

test('should map with operands', (t) => {
  const def = {
    id: ['id'],
    orderTotal: ['total', { $op: 'float', precision: 2 }]
  }
  const data = {
    id: '12345',
    total: '128.1844321'
  }
  const expected = {
    id: '12345',
    orderTotal: 128.18
  }

  const ret = mapTransform(def, { operations })(data)

  t.deepEqual(ret, expected)
})

test('should do nothing for unknown operation', (t) => {
  const def = {
    id: ['id'],
    orderTotal: ['total', { $op: 'unknown', ignorance: 'bliss' }]
  }
  const data = {
    id: '12345',
    total: '128.1844321'
  }
  const expected = {
    id: '12345',
    orderTotal: '128.1844321'
  }

  const ret = mapTransform(def, { operations })(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with operation object', (t) => {
  const def = {
    id: ['id'],
    orderTotal: ['total', rev({ $op: 'float', precision: 2 })]
  }
  const data = {
    id: '12345',
    orderTotal: '128.1844321'
  }
  const expected = {
    id: '12345',
    total: 128.18
  }

  const ret = mapTransform(def, { operations }).rev(data)

  t.deepEqual(ret, expected)
})
