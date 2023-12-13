import test from 'ava'

import logical from './logical.js'

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

// Test -- forward

test('should do a logical AND on the given paths -- and return false', async (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { visible: true, meta: { published: false }, public: true }

  const ret = await logical({ path, operator: 'AND' })(options)(data, state)

  t.false(ret)
})

test('should do a logical AND on the given paths -- and return true', async (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { visible: true, meta: { published: true }, public: true }

  const ret = await logical({ path, operator: 'AND' })(options)(data, state)

  t.true(ret)
})

test('should do a logical OR on the given paths -- and return false', async (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { visible: false, meta: { published: false }, public: false }

  const ret = await logical({ path, operator: 'OR' })(options)(data, state)

  t.false(ret)
})

test('should do a logical OR on the given paths -- and return true', async (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { visible: false, meta: { published: true }, public: false }

  const ret = await logical({ path, operator: 'OR' })(options)(data, state)

  t.true(ret)
})

test('should force values to boolean -- going forward', async (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = {
    visible: false,
    meta: { published: new Date() },
    public: false,
  }

  const ret = await logical({ path, operator: 'OR' })(options)(data, state)

  t.true(ret)
})

test('should do a logical OR on the given paths -- using the root', async (t) => {
  const stateWithRoot = { ...state, context: [{ acceptAll: true }] }
  const path = ['^^.acceptAll', 'visible', 'meta.published', 'public']
  const data = { visible: false, meta: { published: false }, public: false }

  const ret = await logical({ path, operator: 'OR' })(options)(
    data,
    stateWithRoot,
  )

  t.true(ret)
})

// Tests -- reverse

test('should set all paths to the given boolean value', async (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = true
  const expected = { visible: true, meta: { published: true }, public: true }

  const ret = await logical({ path, operator: 'AND' })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should force value to boolean -- in reverse', async (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { what: false }
  const expected = { visible: true, meta: { published: true }, public: true }

  const ret = await logical({ path, operator: 'AND' })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})
