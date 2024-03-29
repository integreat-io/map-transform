import test from 'ava'
import mapTransform from '../../index.js'
import items from '../data/items.js'

interface Item {
  id: string
  customerId: string
  customerName?: string
}

// Tests

test('should filter with compare with match path', async (t) => {
  const def = [
    'items',
    {
      $iterate: true,
      $modify: true,
      customerName: [
        // It would have been better to use a lookup here, but this works for performance testing
        { customers: '^^.customers', customerId: 'customerId' },
        'customers',
        { $filter: 'compare', path: 'id', matchPath: '^.customerId' },
        '[0].name',
      ],
    },
  ]
  const data = items
  const fn = mapTransform(def)
  const start = Date.now()

  const ret = (await fn(data)) as Item[]

  const end = Date.now()
  t.is(ret.length, 10000)
  t.is(ret[0].customerId, '2')
  t.is(ret[0].customerName, 'Customer 2')

  console.log(`### Compare with match path took ${end - start} ms`)
})
