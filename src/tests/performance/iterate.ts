import test from 'ava'
import mapTransform from '../../index.js'
import items from '../data/items.js'

interface Item {
  id: string
  customerId: string
  customerName?: string
}

// Tests

test('should iterate over items', async (t) => {
  const def = [
    'items',
    {
      $iterate: true,
      $modify: true,
      customerName: '^^.customers[0].name', // Setting the first customer's name on all items
    },
  ]
  const data = items
  const fn = mapTransform(def)
  const start = Date.now()

  const ret = (await fn(data)) as Item[]

  const end = Date.now()
  t.is(ret.length, 10000)
  t.is(ret[0].customerId, '2')
  t.is(ret[0].customerName, 'Customer 1')

  console.log(`### Iterate took ${end - start} ms`)
})
