import test from 'ava'
import mapTransform from '../../index.js'
import items from '../data/items.js'

interface Item {
  id: string
  customerId: string
  customerName?: string
}

// Tests

test('should filter items', async (t) => {
  const def = ['items[]', { $filter: 'compare', path: 'id', match: '2' }]
  const data = items
  const fn = mapTransform(def)
  const start = Date.now()

  const ret = (await fn(data)) as Item[]

  const end = Date.now()
  t.is(ret.length, 2)
  t.is(ret[0].id, '2')
  t.is(ret[0].customerId, '3')

  console.log(`### Filter took ${end - start} ms`) // 6 ms
})
