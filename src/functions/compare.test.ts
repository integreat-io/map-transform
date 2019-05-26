import test from 'ava'

import compare from './compare'

test('should return true when object has value at path', (t) => {
  const value = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare(path, value)(data)

  t.true(ret)
})

test('should return false when object does not have value at path', (t) => {
  const value = 'admin'
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: 'editor' } }

  const ret = compare(path, value)(data)

  t.false(ret)
})

test('should return false when object does not path', (t) => {
  const value = 'admin'
  const path = 'meta.role'
  const data = { name: 'Anonymous' }

  const ret = compare(path, value)(data)

  t.false(ret)
})

test('should return true when object has value in array at path', (t) => {
  const value = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: [ 'news', 'politics' ] }

  const ret = compare(path, value)(data)

  t.true(ret)
})

test('should return false when object does not have value in array at path', (t) => {
  const value = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: [ 'fashion' ] }

  const ret = compare(path, value)(data)

  t.false(ret)
})
