import test from 'ava'

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

test('should return true when object has match value at path', async (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = await compare({ path, operator: '=', match })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should return true when object has match value at path in reverse', async (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = await compare({ path, operator: '=', match })(options)(
    data,
    stateRev
  )

  t.true(ret)
})

test('should return false when object does not have match value at path', async (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: 'editor' } }

  const ret = await compare({ path, operator: '=', match })(options)(
    data,
    state
  )

  t.false(ret)
})

test('should return false when object does not have property at path', async (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'Anonymous' }

  const ret = await compare({ path, operator: '=', match })(options)(
    data,
    state
  )

  t.false(ret)
})

test('should return true when object has match value in array at path', async (t) => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['news', 'politics'] }

  const ret = await compare({ path, operator: '=', match })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should return false when object does not have match value in array at path', async (t) => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['fashion'] }

  const ret = await compare({ path, operator: '=', match })(options)(
    data,
    state
  )

  t.false(ret)
})

test('should accept undefined as a match value', async (t) => {
  const match = undefined
  const path = '.'
  const data = undefined

  const ret = await compare({ path, operator: '=', match })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should use matchPath to get match value from data', async (t) => {
  const path = 'meta.role'
  const matchPath = 'level'
  const data = { name: 'John F.', meta: { role: 'admin' }, level: 'admin' }

  const ret = await compare({ path, operator: '=', matchPath })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should use matchPath to get match value from data in reverse', async (t) => {
  const path = 'meta.role'
  const matchPath = 'level'
  const data = { name: 'John F.', meta: { role: 'admin' }, level: 'admin' }

  const ret = await compare({ path, operator: '=', matchPath })(options)(
    data,
    stateRev
  )

  t.true(ret)
})

test('should support root prefix in matchPath', async (t) => {
  const path = 'meta.role'
  const matchPath = '^^acceptLevel'
  const data = { name: 'John F.', meta: { role: 'editor' }, level: 'admin' }
  const stateWithRoot = {
    context: [{ user: data, acceptLevel: 'editor' }, data],
    value: data,
  }

  const ret = await compare({ path, operator: '=', matchPath })(options)(
    data,
    stateWithRoot
  )

  t.true(ret)
})

test('should support obsolete root prefix in matchPath', async (t) => {
  const path = 'meta.role'
  const matchPath = '^acceptLevel'
  const data = { name: 'John F.', meta: { role: 'editor' }, level: 'admin' }
  const stateWithRoot = {
    context: [{ user: data, acceptLevel: 'editor' }, data],
    value: data,
  }

  const ret = await compare({ path, operator: '=', matchPath })(options)(
    data,
    stateWithRoot
  )

  t.true(ret)
})

test('should use equality as default operator', async (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = await compare({ path, match })(options)(data, state)

  t.true(ret)
})

test('should return false for unknown operator', async (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = await compare({ path, operator: '🛀', match })(options)(
    data,
    state
  )

  t.false(ret)
})

test('should use . as path when no path', async (t) => {
  const match = 'admin'
  const data = 'admin'

  const ret = await compare({ match })(options)(data, state)

  t.true(ret)
})

test('should return true when not equal', async (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = await compare({ path, operator: '!=', match })(options)(
    data,
    state
  )

  t.false(ret)
})

test('should return true when not in array', async (t) => {
  const match = 'unknown'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['news', 'politics'] }

  const ret = await compare({ path, operator: '!=', match })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should return false when in array', async (t) => {
  const match = 'news'
  const path = 'sections'
  const data = { title: 'Entry', sections: ['news', 'politics'] }

  const ret = await compare({ path, operator: '!=', match })(options)(
    data,
    state
  )

  t.false(ret)
})

test('should support higher and lower than', async (t) => {
  const data = { name: 'John F.', age: 36 }

  t.true(
    await compare({ path: 'age', operator: '>', match: 18 })(options)(
      data,
      state
    )
  )
  t.true(
    await compare({ path: 'age', operator: '<', match: 40 })(options)(
      data,
      state
    )
  )
  t.true(
    await compare({ path: 'age', operator: '>=', match: 36 })(options)(
      data,
      state
    )
  )
  t.true(
    await compare({ path: 'age', operator: '<=', match: 36 })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'age', operator: '>', match: 36 })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'age', operator: '<', match: 36 })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'age', operator: '>=', match: 37 })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'age', operator: '<=', match: 35 })(options)(
      data,
      state
    )
  )
})

test('should support higher and lower than in array', async (t) => {
  const data = { name: 'John F.', age: [10, 36] }

  t.true(
    await compare({ path: 'age', operator: '>', match: 18 })(options)(
      data,
      state
    )
  )
  t.true(
    await compare({ path: 'age', operator: '<', match: 40 })(options)(
      data,
      state
    )
  )
  t.true(
    await compare({ path: 'age', operator: '>=', match: 36 })(options)(
      data,
      state
    )
  )
  t.true(
    await compare({ path: 'age', operator: '<=', match: 36 })(options)(
      data,
      state
    )
  )
  t.true(
    await compare({ path: 'age', operator: '<', match: 12 })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'age', operator: '>', match: 36 })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'age', operator: '<', match: 10 })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'age', operator: '>=', match: 37 })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'age', operator: '<=', match: 9 })(options)(
      data,
      state
    )
  )
})

test('should support require numeric value and match', async (t) => {
  const data = { name: 'John F.', age: 36 }

  t.false(
    await compare({ path: 'name', operator: '>', match: 36 })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'name', operator: '<', match: 36 })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'age', operator: '>=', match: '37' })(options)(
      data,
      state
    )
  )
  t.false(
    await compare({ path: 'age', operator: '<=', match: '35' })(options)(
      data,
      state
    )
  )
})

test('should return true when the value at path is not undefined', async (t) => {
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = await compare({ path, operator: 'exists' })(options)(data, state)

  t.true(ret)
})

test('should support **undefined** when comparing to undefined in JSON', async (t) => {
  const match = '**undefined**'
  const path = 'meta.role'
  const data = { name: 'John F.' }

  const ret = await compare({ path, operator: '=', match })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should return true when value is in array', async (t) => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = await compare({ path, operator: 'in', match })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should return true when value is in array and is undefined', async (t) => {
  const match = ['admin', '**undefined**', 'editor']
  const path = 'meta.role'
  const data = { name: 'John F.', meta: {} }

  const ret = await compare({ path, operator: 'in', match })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should return false when value is not in array', async (t) => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: 'viewer' } }

  const ret = await compare({ path, operator: 'in', match })(options)(
    data,
    state
  )

  t.false(ret)
})

test('should return true when value array has at least one of the items in match array', async (t) => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: ['viewer', 'admin'] } }

  const ret = await compare({ path, operator: 'in', match })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should return false when value array has none of the items in match array', async (t) => {
  const match = ['admin', 'editor']
  const path = 'meta.role'
  const data = { name: 'Fred J.', meta: { role: ['viewer', 'user'] } }

  const ret = await compare({ path, operator: 'in', match })(options)(
    data,
    state
  )

  t.false(ret)
})

test('should return false when comparison is true and `not` is set', async (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = await compare({ path, operator: '=', match, not: true })(options)(
    data,
    state
  )

  t.false(ret)
})

test('should return true when comparison is false and `not` is set', async (t) => {
  const match = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'viewer' } }

  const ret = await compare({ path, operator: '=', match, not: true })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should treat `value` as alias of `match`', async (t) => {
  const value = 'admin'
  const path = 'meta.role'
  const data = { name: 'John F.', meta: { role: 'admin' } }

  const ret = await compare({ path, operator: '=', value })(options)(
    data,
    state
  )

  t.true(ret)
})

test('should treat `valuePath` as an alias of `matchPath`', async (t) => {
  const path = 'meta.role'
  const valuePath = 'level'
  const data = { name: 'John F.', meta: { role: 'admin' }, level: 'admin' }

  const ret = await compare({ path, operator: '=', valuePath })(options)(
    data,
    state
  )

  t.true(ret)
})
