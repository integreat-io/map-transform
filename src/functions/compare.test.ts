import test from 'ava'

import compare from './compare'

// Setup

const state = {
  rev: false,
  onlyMapped: false,
  root: {},
  context: {},
  value: {},
}

// Test

test('should return true when object has match value at path', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '=', match })(data, state)

  t.true(ret)
})

test('should return false when object does not have match value at path', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: 'editor' } }

  const ret = compare({ path, operator: '=', match })(data, state)

  t.false(ret)
})

test('should return false when object does not have property at path', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'Anonymous' }

  const ret = compare({ path, operator: '=', match })(data, state)

  t.false(ret)
})

test('should return true when object has match value in array at path', (t) => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['news', 'politics'] }

  const ret = compare({ path, operator: '=', match })(data, state)

  t.true(ret)
})

test('should return false when object does not have match value in array at path', (t) => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['fashion'] }

  const ret = compare({ path, operator: '=', match })(data, state)

  t.false(ret)
})

test('should accept undefined as a match value', (t) => {
  const match = undefined
  const path = '.'
  const data = undefined

  const ret = compare({ path, operator: '=', match })(data, state)

  t.true(ret)
})

test('should use matchPath to get match value from data', (t) => {
  const path = 'meta.role'
  const matchPath = 'level'
  const data = { name: 'John F.', meta: { role: 'admin' }, level: 'admin' }

  const ret = compare({ path, operator: '=', matchPath })(data, state)

  t.true(ret)
})

test('should support carret (root) in matchPath', (t) => {
  const path = 'meta.role'
  const matchPath = '^acceptLevel'
  const data = { name: 'John F.', meta: { role: 'editor' }, level: 'admin' }
  const stateWithRoot = {
    root: { user: data, acceptLevel: 'editor' },
    context: data,
    value: data,
  }

  const ret = compare({ path, operator: '=', matchPath })(data, stateWithRoot)

  t.true(ret)
})

test('should use equality as default operator', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, match })(data, state)

  t.true(ret)
})

test('should return false for unknown operator', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '🛀', match })(data, state)

  t.false(ret)
})

test('should use . as path when no path', (t) => {
  const match = 'admin'
  const data = 'admin'

  const ret = compare({ match })(data, state)

  t.true(ret)
})

test('should return true when not equal', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '!=', match })(data, state)

  t.false(ret)
})

test('should return true when not in array', (t) => {
  const match = 'unknown'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['news', 'politics'] }

  const ret = compare({ path, operator: '!=', match })(data, state)

  t.true(ret)
})

test('should return false when in array', (t) => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['news', 'politics'] }

  const ret = compare({ path, operator: '!=', match })(data, state)

  t.false(ret)
})

test('should support higher and lower than', (t) => {
  const data = { name: 'John F.', age: 36 }

  t.true(compare({ path: 'age', operator: '>', match: 18 })(data, state))
  t.true(compare({ path: 'age', operator: '<', match: 40 })(data, state))
  t.true(compare({ path: 'age', operator: '>=', match: 36 })(data, state))
  t.true(compare({ path: 'age', operator: '<=', match: 36 })(data, state))
  t.false(compare({ path: 'age', operator: '>', match: 36 })(data, state))
  t.false(compare({ path: 'age', operator: '<', match: 36 })(data, state))
  t.false(compare({ path: 'age', operator: '>=', match: 37 })(data, state))
  t.false(compare({ path: 'age', operator: '<=', match: 35 })(data, state))
})

test('should support higher and lower than in array', (t) => {
  const data = { name: 'John F.', age: [10, 36] }

  t.true(compare({ path: 'age', operator: '>', match: 18 })(data, state))
  t.true(compare({ path: 'age', operator: '<', match: 40 })(data, state))
  t.true(compare({ path: 'age', operator: '>=', match: 36 })(data, state))
  t.true(compare({ path: 'age', operator: '<=', match: 36 })(data, state))
  t.true(compare({ path: 'age', operator: '<', match: 12 })(data, state))
  t.false(compare({ path: 'age', operator: '>', match: 36 })(data, state))
  t.false(compare({ path: 'age', operator: '<', match: 10 })(data, state))
  t.false(compare({ path: 'age', operator: '>=', match: 37 })(data, state))
  t.false(compare({ path: 'age', operator: '<=', match: 9 })(data, state))
})

test('should support require numeric value and match', (t) => {
  const data = { name: 'John F.', age: 36 }

  t.false(compare({ path: 'name', operator: '>', match: 36 })(data, state))
  t.false(compare({ path: 'name', operator: '<', match: 36 })(data, state))
  t.false(compare({ path: 'age', operator: '>=', match: '37' })(data, state))
  t.false(compare({ path: 'age', operator: '<=', match: '35' })(data, state))
})

test('should return true when value is in array', (t) => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: 'in', match })(data, state)

  t.true(ret)
})

test('should return false when value is not in array', (t) => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: 'viewer' } }

  const ret = compare({ path, operator: 'in', match })(data, state)

  t.false(ret)
})

test('should return true when value array has at least one of the items in match array', (t) => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: ['viewer', 'admin'] } }

  const ret = compare({ path, operator: 'in', match })(data, state)

  t.true(ret)
})

test('should return false when value array has none of the items in match array', (t) => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: ['viewer', 'user'] } }

  const ret = compare({ path, operator: 'in', match })(data, state)

  t.false(ret)
})

test('should return false when comparison is true and `not` is set', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '=', match, not: true })(data, state)

  t.false(ret)
})

test('should return true when comparison is false and `not` is set', (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'viewer' } }

  const ret = compare({ path, operator: '=', match, not: true })(data, state)

  t.true(ret)
})
