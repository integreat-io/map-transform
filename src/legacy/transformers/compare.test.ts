import test from 'node:test'
import assert from 'node:assert/strict'
import { get } from '../operations/getSet.js'

import compare from './compare.js'

// Setup

const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}

const stateRev = {
  rev: true,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Tests

test('should return true when object has match value at path', () => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '=', match })(options)(data, state)

  assert.equal(ret, true)
})

test('should match dates with ms values', () => {
  const match = new Date('2025-05-18T00:43:51+02:00')
  const path = 'date'
  const data = { date: new Date('2025-05-18T00:43:51+02:00') }

  const ret = compare({ path, operator: '=', match })(options)(data, state)

  assert.equal(ret, true)
})

test('should return true when matching null', () => {
  const match = null
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: null } }

  const ret = compare({ path, operator: '=', match })(options)(data, state)

  assert.equal(ret, true)
})

test('should return true when object has match value at path in reverse', () => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '=', match })(options)(data, stateRev)

  assert.equal(ret, true)
})

test('should return false when object does not have match value at path', () => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: 'editor' } }

  const ret = compare({ path, operator: '=', match })(options)(data, state)

  assert.equal(ret, false)
})

test('should return false when object does not have property at path', () => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'Anonymous' }

  const ret = compare({ path, operator: '=', match })(options)(data, state)

  assert.equal(ret, false)
})

test('should return true when object has match value in array at path', () => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['news', 'politics'] }

  const ret = compare({ path, operator: '=', match })(options)(data, state)

  assert.equal(ret, true)
})

test('should return false when object does not have match value in array at path', () => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['fashion'] }

  const ret = compare({ path, operator: '=', match })(options)(data, state)

  assert.equal(ret, false)
})

test('should accept undefined as a match value', () => {
  const match = undefined
  const path = '.'
  const data = undefined

  const ret = compare({ path, operator: '=', match })(options)(data, state)

  assert.equal(ret, true)
})

test('should use matchPath to get match value from data', () => {
  const path = 'meta.role'
  const matchPath = 'level'
  const data = { name: 'John F.', meta: { role: 'admin' }, level: 'admin' }

  const ret = compare({ path, operator: '=', matchPath })(options)(data, state)

  assert.equal(ret, true)
})

test('should use matchPath to get match value from data in reverse', () => {
  const path = 'meta.role'
  const matchPath = 'level'
  const data = { name: 'John F.', meta: { role: 'admin' }, level: 'admin' }

  const ret = compare({ path, operator: '=', matchPath })(options)(
    data,
    stateRev,
  )

  assert.equal(ret, true)
})

test('should support root prefix in matchPath', () => {
  const path = 'meta.role'
  const matchPath = '^^acceptLevel'
  const data = { name: 'John F.', meta: { role: 'editor' }, level: 'admin' }
  const stateWithRoot = {
    context: [{ user: data, acceptLevel: 'editor' }, data],
    value: data,
  }

  const ret = compare({ path, operator: '=', matchPath })(options)(
    data,
    stateWithRoot,
  )

  assert.equal(ret, true)
})

test('should support obsolete root prefix in matchPath', () => {
  const path = 'meta.role'
  const matchPath = '^acceptLevel'
  const data = { name: 'John F.', meta: { role: 'editor' }, level: 'admin' }
  const stateWithRoot = {
    context: [{ user: data, acceptLevel: 'editor' }, data],
    value: data,
  }

  const ret = compare({ path, operator: '=', matchPath })(options)(
    data,
    stateWithRoot,
  )

  assert.equal(ret, true)
})

test('should use equality as default operator', () => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, match })(options)(data, state)

  assert.equal(ret, true)
})

test('should return false for unknown operator', () => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '🛀', match })(options)(data, state)

  assert.equal(ret, false)
})

test('should use . as path when no path', () => {
  const match = 'admin'
  const data = 'admin'

  const ret = compare({ match })(options)(data, state)

  assert.equal(ret, true)
})

test('should return true when not equal', () => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '!=', match })(options)(data, state)

  assert.equal(ret, false)
})

test('should return true when not in array', () => {
  const match = 'unknown'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['news', 'politics'] }

  const ret = compare({ path, operator: '!=', match })(options)(data, state)

  assert.equal(ret, true)
})

test('should return false when in array', () => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['news', 'politics'] }

  const ret = compare({ path, operator: '!=', match })(options)(data, state)

  assert.equal(ret, false)
})

test('should support higher and lower than', () => {
  const data = { name: 'John F.', age: 36 }

  assert.ok(
    compare({ path: 'age', operator: '>', match: 18 })(options)(data, state),
  )
  assert.ok(
    compare({ path: 'age', operator: '<', match: 40 })(options)(data, state),
  )
  assert.ok(
    compare({ path: 'age', operator: '>=', match: 36 })(options)(data, state),
  )
  assert.ok(
    compare({ path: 'age', operator: '<=', match: 36 })(options)(data, state),
  )
  assert.ok(
    !compare({ path: 'age', operator: '>', match: 36 })(options)(data, state),
  )
  assert.ok(
    !compare({ path: 'age', operator: '<', match: 36 })(options)(data, state),
  )
  assert.ok(
    !compare({ path: 'age', operator: '>=', match: 37 })(options)(data, state),
  )
  assert.ok(
    !compare({ path: 'age', operator: '<=', match: 35 })(options)(data, state),
  )
})

test('should support higher and lower than in array', () => {
  const data = { name: 'John F.', age: [10, 36] }

  assert.ok(
    compare({ path: 'age', operator: '>', match: 18 })(options)(data, state),
  )
  assert.ok(
    compare({ path: 'age', operator: '<', match: 40 })(options)(data, state),
  )
  assert.ok(
    compare({ path: 'age', operator: '>=', match: 36 })(options)(data, state),
  )
  assert.ok(
    compare({ path: 'age', operator: '<=', match: 36 })(options)(data, state),
  )
  assert.ok(
    compare({ path: 'age', operator: '<', match: 12 })(options)(data, state),
  )
  assert.ok(
    !compare({ path: 'age', operator: '>', match: 36 })(options)(data, state),
  )
  assert.ok(
    !compare({ path: 'age', operator: '<', match: 10 })(options)(data, state),
  )
  assert.ok(
    !compare({ path: 'age', operator: '>=', match: 37 })(options)(data, state),
  )
  assert.ok(
    !compare({ path: 'age', operator: '<=', match: 9 })(options)(data, state),
  )
})

test('should support require numeric value and match', () => {
  const data = { name: 'John F.', age: 36 }

  assert.ok(
    !compare({ path: 'name', operator: '>', match: 36 })(options)(data, state),
  )
  assert.ok(
    !compare({ path: 'name', operator: '<', match: 36 })(options)(data, state),
  )
  assert.ok(
    !compare({ path: 'age', operator: '>=', match: '37' })(options)(
      data,
      state,
    ),
  )
  assert.ok(
    !compare({ path: 'age', operator: '<=', match: '35' })(options)(
      data,
      state,
    ),
  )
})

test('should match dates with ms values with greater or less than operators', () => {
  const match = new Date('2025-05-18T00:43:51+02:00')
  const path = 'date'
  const data = { date: new Date('2025-05-18T01:11:37+02:00') }

  assert.equal(
    compare({ path, operator: '>', match })(options)(data, state),
    true,
  )
  assert.equal(
    compare({ path, operator: '<', match })(options)(data, state),
    false,
  )
})

test('should return true when the value at path is not undefined', () => {
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: 'exists' })(options)(data, state)

  assert.equal(ret, true)
})

test('should support **undefined** when comparing to undefined in JSON', () => {
  const match = '**undefined**'
  const path = 'meta.role'
  const data = { name: 'John F.' }

  const ret = compare({ path, operator: '=', match })(options)(data, state)

  assert.equal(ret, true)
})

test('should return true when value is in array', () => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: 'in', match })(options)(data, state)

  assert.equal(ret, true)
})

test('should return true when value is in array and is undefined', () => {
  const match = ['admin', '**undefined**', 'editor']
  const path = 'meta.role'
  const data = { name: 'John F.', meta: {} }

  const ret = compare({ path, operator: 'in', match })(options)(data, state)

  assert.equal(ret, true)
})

test('should return false when value is not in array', () => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: 'viewer' } }

  const ret = compare({ path, operator: 'in', match })(options)(data, state)

  assert.equal(ret, false)
})

test('should return true when value array has at least one of the items in match array', () => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: ['viewer', 'admin'] } }

  const ret = compare({ path, operator: 'in', match })(options)(data, state)

  assert.equal(ret, true)
})

test('should return false when value array has none of the items in match array', () => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: ['viewer', 'user'] } }

  const ret = compare({ path, operator: 'in', match })(options)(data, state)

  assert.equal(ret, false)
})

test('should return false when comparison is true and `not` is set', () => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '=', match, not: true })(options)(
    data,
    state,
  )

  assert.equal(ret, false)
})

test('should return true when comparison is false and `not` is set', () => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'viewer' } }

  const ret = compare({ path, operator: '=', match, not: true })(options)(
    data,
    state,
  )

  assert.equal(ret, true)
})

test('should support pipeline as path', async () => {
  const match = 'admin'
  const path = [get('meta.role')]
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = await compare({ path, operator: '=', match })(options)(
    data,
    state,
  )

  assert.equal(ret, true)
})

test('should treat `value` as alias of `match`', () => {
  const value = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = compare({ path, operator: '=', value })(options)(data, state)

  assert.equal(ret, true)
})

test('should treat `valuePath` as an alias of `matchPath`', () => {
  const path = 'meta.role'
  const valuePath = 'level'
  const data = { name: 'John F.', meta: { role: 'admin' }, level: 'admin' }

  const ret = compare({ path, operator: '=', valuePath })(options)(data, state)

  assert.equal(ret, true)
})
