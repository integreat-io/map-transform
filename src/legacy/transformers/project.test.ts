import test from 'node:test'
import assert from 'node:assert/strict'

import project from './project.js'

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

// Tests -- forward

test('should keep only props specified by include', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
  }
  const include = ['id', 'title']
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = project({ include })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should exclude props specified by exclude', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
  }
  const exclude = ['$type', 'title']
  const expected = { id: 'ent1', author: { id: 'johnf' } }

  const ret = project({ exclude })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should use include when exclude is also specified', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
  }
  const include = ['id', 'title']
  const exclude = ['$type', 'title']
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = project({ include, exclude })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should use keys from includePath', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
    meta: {
      keys: ['id', 'title'],
    },
  }
  const includePath = 'meta.keys'
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = project({ includePath })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should leave object untouched when no keys in includePath', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
    meta: {
      // No keys
    },
  }
  const includePath = 'meta.keys'
  const expected = data

  const ret = project({ includePath })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should use include keys as fall-back for includePath', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
    meta: {
      // No keys
    },
  }
  const includePath = 'meta.keys'
  const include = ['id', 'title']
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = project({ includePath, include })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should use keys from excludePath', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
    meta: {
      keys: ['$type', 'title', 'meta'],
    },
  }
  const excludePath = 'meta.keys'
  const expected = { id: 'ent1', author: { id: 'johnf' } }

  const ret = project({ excludePath })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should leave object untouched when no keys in excludePath', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
    meta: {
      // No keys
    },
  }
  const excludePath = 'meta.keys'
  const expected = data

  const ret = project({ excludePath })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should use exclude keys as fall-back for excludePath', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
    meta: {
      // No keys
    },
  }
  const excludePath = 'meta.keys'
  const exclude = ['$type', 'title', 'meta']
  const expected = { id: 'ent1', author: { id: 'johnf' } }

  const ret = project({ excludePath, exclude })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should return object as is when neither include nor exclude are defined', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
  }
  const expected = data

  const ret = project({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should skip include props that are not strings', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
  }
  const include = ['id', 43, 'title', new Date()] as unknown as string[]
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = project({ include })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should skip exclude props that are not string', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
  }
  const exclude = ['$type', 18, 'title', true] as unknown as string[]
  const expected = { id: 'ent1', author: { id: 'johnf' } }

  const ret = project({ exclude })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should include in array', () => {
  const data = [
    {
      id: 'ent1',
      title: 'Entry 1',
      $type: 'entry',
      author: { id: 'johnf' },
    },
    { id: 'ent2', $type: 'entry' },
  ]
  const include = ['id', 'title']
  const expected = [{ id: 'ent1', title: 'Entry 1' }, { id: 'ent2' }]

  const ret = project({ include })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should exclude in array', () => {
  const data = [
    {
      id: 'ent1',
      title: 'Entry 1',
      $type: 'entry',
      author: { id: 'johnf' },
    },
    { id: 'ent2', $type: 'entry' },
  ]
  const exclude = ['$type', 'title']
  const expected = [{ id: 'ent1', author: { id: 'johnf' } }, { id: 'ent2' }]

  const ret = project({ exclude })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should return objects in array', () => {
  const data = [
    {
      id: 'ent1',
      title: 'Entry 1',
      $type: 'entry',
      author: { id: 'johnf' },
    },
    { id: 'ent2', $type: 'entry' },
    'do not include', // Filter away in array
  ]
  const expected = [...data.slice(0, 2), undefined]

  const ret = project({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should return undefined for non-objects for include', () => {
  const include = ['id', 'title']

  assert.equal(project({ include })(options)('nope', state), undefined)
  assert.equal(project({ include })(options)(false, state), undefined)
  assert.equal(project({ include })(options)(new Date(), state), undefined)
  assert.equal(project({ include })(options)(null, state), undefined)
  assert.equal(project({ include })(options)(undefined, state), undefined)
})

test('should return undefined for non-objects for exclude', () => {
  const exclude = ['$type', 'title']

  assert.equal(project({ exclude })(options)('nope', state), undefined)
  assert.equal(project({ exclude })(options)(false, state), undefined)
  assert.equal(project({ exclude })(options)(new Date(), state), undefined)
  assert.equal(project({ exclude })(options)(null, state), undefined)
  assert.equal(project({ exclude })(options)(undefined, state), undefined)
})

test('should return undefined for non-objects for neither include nor exclude', () => {
  assert.equal(project({})(options)('nope', state), undefined)
  assert.equal(project({})(options)(false, state), undefined)
  assert.equal(project({})(options)(new Date(), state), undefined)
  assert.equal(project({})(options)(null, state), undefined)
  assert.equal(project({})(options)(undefined, state), undefined)
})

// Tests -- reverse

test('should do include in reverse', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
  }
  const include = ['id', 'title']
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = project({ include })(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})

test('should do exclude in reverse', () => {
  const data = {
    id: 'ent1',
    title: 'Entry 1',
    $type: 'entry',
    author: { id: 'johnf' },
  }
  const exclude = ['$type', 'title']
  const expected = { id: 'ent1', author: { id: 'johnf' } }

  const ret = project({ exclude })(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})

test('should return undefined for non-objects in reverse', () => {
  assert.equal(project({})(options)('nope', stateRev), undefined)
  assert.equal(project({})(options)(false, stateRev), undefined)
  assert.equal(project({})(options)(new Date(), stateRev), undefined)
  assert.equal(project({})(options)(null, stateRev), undefined)
  assert.equal(project({})(options)(undefined, stateRev), undefined)
})
