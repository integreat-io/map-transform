import test from 'node:test'
import assert from 'node:assert/strict'
import mapTransform from '../../index.js'
import items from '../data/items.js'

interface Item {
  id: string
  customerId: string
  customerName?: string
}

// Tests

test('should filter with compare', async () => {
  const def = [
    'items',
    {
      $iterate: true,
      $modify: true,
      customerName: [
        // It would have been better to use a lookup here, but this works for performance testing
        { customers: '^^.customers', customerId: 'customerId' },
        'customers',
        { $filter: 'compare', path: 'id', match: '2' }, // We're setting the same customer on all, just for testing
        '[0].name',
      ],
    },
  ]
  const data = items
  const fn = mapTransform(def)
  const start = Date.now()

  const ret = (await fn(data)) as Item[]

  const end = Date.now()
  assert.equal(ret.length, 10000)
  assert.equal(ret[0].customerId, '2')
  assert.equal(ret[0].customerName, 'Customer 2')

  console.log(`### Compare took ${end - start} ms`)
})
