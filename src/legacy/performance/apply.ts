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

test('should apply pipeline for every item', async () => {
  const pipelines = {
    castItem: {
      key: 'id',
      name: 'title',
      customer: 'customerId',
    },
  }
  const def = ['items', { $apply: 'castItem', $iterate: true }]
  const data = items
  const fn = mapTransform(def, { pipelines })
  const start = Date.now()

  const ret = (await fn(data)) as Item[]

  const end = Date.now()
  assert.equal(ret.length, 10000)
  assert.equal(ret[0].key, '1')
  assert.equal(ret[0].name, 'Item 1')
  assert.equal(ret[0].customer, '2')

  console.log(`### Apply took ${end - start} ms`)
})

test('should apply pipeline applying another pipeline for every item', async () => {
  const pipelines = {
    castItem: [{ $apply: 'setProps' }, { $apply: 'setCustomer' }],
    setProps: {
      $modify: true,
      key: 'id',
      name: 'title',
    },
    setCustomer: {
      $modify: true,
      customer: 'customerId',
    },
  }
  const def = ['items', { $apply: 'castItem', $iterate: true }]
  const data = items
  const fn = mapTransform(def, { pipelines })
  const start = Date.now()

  const ret = (await fn(data)) as Item[]

  const end = Date.now()
  assert.equal(ret.length, 10000)
  assert.equal(ret[0].key, '1')
  assert.equal(ret[0].name, 'Item 1')
  assert.equal(ret[0].customer, '2')

  console.log(`### Apply nested took ${end - start} ms`)
})
