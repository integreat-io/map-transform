import test from 'ava'

import compare from './compare'

test('should return true when object has match value at path', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '=', match })(data)

  t.true(ret)
})

test('should return false when object does not have match value at path', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: 'editor' } }

  const ret = compare({ path, operator: '=', match })(data)

  t.false(ret)
})

test('should return false when object does not have property at path', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'Anonymous' }

  const ret = compare({ path, operator: '=', match })(data)

  t.false(ret)
})

test('should return true when object has match value in array at path', (t) => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: [ 'news', 'politics' ] }

  const ret = compare({ path, operator: '=', match })(data)

  t.true(ret)
})

test('should return false when object does not have match value in array at path', (t) => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: [ 'fashion' ] }

  const ret = compare({ path, operator: '=', match })(data)

  t.false(ret)
})

test('should use equality as default operator', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, match })(data)

  t.true(ret)
})

test('should return false for unknown operator', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '🛀', match })(data)

  t.false(ret)
})

test('should return true when not equal', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '!=', match })(data)

  t.false(ret)
})

test('should return true when not in array', (t) => {
  const match = 'unknown'
  const path = 'sections'
  const data = { title: 'Entry', sections: [ 'news', 'politics' ] }

  const ret = compare({ path, operator: '!=', match })(data)

  t.true(ret)
})

test('should return false when in array', (t) => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: [ 'news', 'politics' ] }

  const ret = compare({ path, operator: '!=', match })(data)

  t.false(ret)
})

test('should support higher and lower than', (t) => {
  const data = { name: 'John F.', age: 36 }

  t.true(compare({ path: 'age', operator: '>', match: 18 })(data))
  t.true(compare({ path: 'age', operator: '<', match: 40 })(data))
  t.true(compare({ path: 'age', operator: '>=', match: 36 })(data))
  t.true(compare({ path: 'age', operator: '<=', match: 36 })(data))
  t.false(compare({ path: 'age', operator: '>', match: 36 })(data))
  t.false(compare({ path: 'age', operator: '<', match: 36 })(data))
  t.false(compare({ path: 'age', operator: '>=', match: 37 })(data))
  t.false(compare({ path: 'age', operator: '<=', match: 35 })(data))
})

test('should support higher and lower than in array', (t) => {
  const data = { name: 'John F.', age: [10, 36] }

  t.true(compare({ path: 'age', operator: '>', match: 18 })(data))
  t.true(compare({ path: 'age', operator: '<', match: 40 })(data))
  t.true(compare({ path: 'age', operator: '>=', match: 36 })(data))
  t.true(compare({ path: 'age', operator: '<=', match: 36 })(data))
  t.true(compare({ path: 'age', operator: '<', match: 12 })(data))
  t.false(compare({ path: 'age', operator: '>', match: 36 })(data))
  t.false(compare({ path: 'age', operator: '<', match: 10 })(data))
  t.false(compare({ path: 'age', operator: '>=', match: 37 })(data))
  t.false(compare({ path: 'age', operator: '<=', match: 9 })(data))
})

test('should support require numeric value and match', (t) => {
  const data = { name: 'John F.', age: 36 }

  t.false(compare({ path: 'name', operator: '>', match: 36 })(data))
  t.false(compare({ path: 'name', operator: '<', match: 36 })(data))
  t.false(compare({ path: 'age', operator: '>=', match: '37' })(data))
  t.false(compare({ path: 'age', operator: '<=', match: '35' })(data))
})
