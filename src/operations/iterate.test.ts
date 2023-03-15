import test from 'ava'
import alt from './alt.js'
import transform from './transform.js'
import { identity } from '../utils/functional.js'

import iterate from './iterate.js'

// Setup

const data = [
  { key: 'ent1', headline: 'Entry 1' },
  { key: 'ent2', headline: 'Entry 2' },
]

const options = {}

// Tests

test('should map over a value array', (t) => {
  const def = {
    id: 'key',
    title: 'headline',
  }
  const state = {
    context: [{ items: data }],
    value: data,
  }
  const expected = {
    context: [{ items: data }],
    value: [
      { id: 'ent1', title: 'Entry 1' },
      { id: 'ent2', title: 'Entry 2' },
    ],
  }

  const ret = iterate(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should map over non-array', (t) => {
  const def = {
    id: 'key',
    title: 'headline',
  }
  const state = {
    context: [],
    value: data[0],
  }
  const expectedValue = { id: 'ent1', title: 'Entry 1' }

  const ret = iterate(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should provide array as context', (t) => {
  const def = {
    id: 'key',
    title: 'headline',
    first: '^[0].key',
    tag: '^.^.section',
  }
  const state = {
    context: [{ items: data, section: 'news' }],
    value: data,
  }
  const expected = {
    context: [{ items: data, section: 'news' }],
    value: [
      { id: 'ent1', title: 'Entry 1', first: 'ent1', tag: 'news' },
      { id: 'ent2', title: 'Entry 2', first: 'ent1', tag: 'news' },
    ],
  }

  const ret = iterate(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should provide array as context through several iterations', (t) => {
  const def1 = {
    key: 'key',
    headline: 'key',
  }
  const def2 = {
    id: 'key',
    title: 'headline',
    first: '^[0].key',
    tag: '^.^.section',
  }
  const state = {
    context: [{ items: data, section: 'news' }],
    value: data,
  }
  const expected = {
    context: [{ items: data, section: 'news' }],
    value: [
      { id: 'ent1', title: 'ent1', first: 'ent1', tag: 'news' },
      { id: 'ent2', title: 'ent2', first: 'ent1', tag: 'news' },
    ],
  }

  const ret1 = iterate(def1)(options)(identity)(state)
  const ret2 = iterate(def2)(options)(identity)(ret1)

  t.deepEqual(ret2, expected)
})

test('should provide array as context through double arrays', (t) => {
  const def = {
    articles: [
      'items[]',
      {
        $iterate: true,
        id: 'key',
        title: 'headline',
        first: '^[0].key',
        tag: '^.^.section',
      },
    ],
  }
  const state = {
    context: [
      { entries: [{ items: data, section: 'news' }] },
      [{ items: data, section: 'news' }],
    ],
    value: [{ items: data, section: 'news' }],
  }
  const expected = {
    ...state,
    value: [
      {
        articles: [
          { id: 'ent1', title: 'Entry 1', first: 'ent1', tag: 'news' },
          { id: 'ent2', title: 'Entry 2', first: 'ent1', tag: 'news' },
        ],
      },
    ],
  }

  const ret = iterate(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return undefined when no def', (t) => {
  const def = {}
  const state = {
    context: [],
    value: data,
  }

  const ret = iterate(def)(options)(identity)(state)

  t.is(ret.value, undefined)
})

test('should iterate context to support alt operation etc.', (t) => {
  const def = alt(
    // First set value for all items with key === 'ent1' ...
    transform(
      () => (item?: unknown) =>
        item && (item as Record<string, unknown>).key === 'ent1'
          ? 'From somewhere else'
          : undefined
    ),
    // ... then set value for all that got `undefined` from the previous transform
    transform(
      () => (item?: unknown) =>
        item
          ? `${(item as Record<string, unknown>).key}: ${
              (item as Record<string, unknown>).headline
            }`
          : ''
    )
  )
  const state = {
    context: [],
    value: data,
  }
  const expected = {
    context: [],
    value: ['From somewhere else', 'ent2: Entry 2'],
  }

  const ret = iterate(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should map over a value array in reverse', (t) => {
  const def = {
    key: 'id',
    headline: 'title',
  }
  const state = {
    context: [],
    value: data,
    rev: true,
  }
  const expected = {
    ...state,
    value: [
      { id: 'ent1', title: 'Entry 1' },
      { id: 'ent2', title: 'Entry 2' },
    ],
  }

  const ret = iterate(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})
