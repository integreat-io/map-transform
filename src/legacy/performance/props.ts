import test from 'node:test'
import assert from 'node:assert/strict'
import mapTransform from '../../index.js'
import items from '../data/items.js'

interface Item {
  key: string
  name: string
  customer: string
}

// Tests

test('should transform with transform object', async () => {
  const def = [
    'items',
    {
      $iterate: true,
      key: 'id',
      name: 'title',
      customer: 'customerId',
    },
  ]
  const data = items
  const fn = mapTransform(def)
  const start = Date.now()

  const ret = (await fn(data)) as Item[]

  const end = Date.now()
  assert.equal(ret.length, 10000)
  assert.equal(ret[0].key, '1')
  assert.equal(ret[0].name, 'Item 1')
  assert.equal(ret[0].customer, '2')

  console.log(`### Props took ${end - start} ms`) // 77 ms
})
