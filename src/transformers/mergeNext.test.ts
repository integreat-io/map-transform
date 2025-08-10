import test from 'node:test'
import assert from 'node:assert/strict'
import type { Transformer, AsyncTransformer } from '../types.js'

import { merge, mergeRev, mergeAsync, mergeRevAsync } from './mergeNext.js'

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

test('should merge two objects', () => {
  const path = ['original', 'modified']
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['news', 'politics'],
    },
    modified: {
      id: 'ent1',
      title: 'Better title',
      text: undefined,
      tags: ['sports'],
    },
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    subtitle: undefined,
    text: 'And so this happened',
    tags: ['sports'],
  }

  const ret = merge({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should merge three objects', () => {
  const path = ['original', 'modified', 'final']
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['news', 'politics'],
    },
    modified: {
      id: 'ent1',
      title: 'Better title',
      text: undefined,
      tags: ['sports'],
    },
    final: {
      title: undefined,
      text: 'Nothing happend',
    },
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    subtitle: undefined,
    text: 'Nothing happend',
    tags: ['sports'],
  }

  const ret = merge({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should skip empty steps', () => {
  const path = ['original', 'modified', null]
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['news', 'politics'],
    },
    modified: {
      id: 'ent1',
      title: 'Better title',
      text: undefined,
      tags: ['sports'],
    },
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    subtitle: undefined,
    text: 'And so this happened',
    tags: ['sports'],
  }

  const ret = merge({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should return one object', () => {
  const path = ['original']
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['news', 'politics'],
    },
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Title 1',
    subtitle: undefined,
    text: 'And so this happened',
    tags: ['news', 'politics'],
  }

  const ret = merge({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should merge array of objects', () => {
  const path = 'all'
  const data = {
    all: [
      {
        id: 'ent1',
        $type: 'entry',
        title: 'Title 1',
        subtitle: undefined,
        text: 'And so this happened',
        tags: ['news', 'politics'],
      },
      {
        id: 'ent1',
        title: 'Better title',
        text: undefined,
        tags: ['sports'],
      },
      {
        title: undefined,
        text: 'Nothing happend',
      },
    ],
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    subtitle: undefined,
    text: 'Nothing happend',
    tags: ['sports'],
  }

  const ret = merge({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should merge object and array of objects', () => {
  const path = ['original', 'therest']
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['news', 'politics'],
    },
    therest: [
      {
        id: 'ent1',
        title: 'Better title',
        text: undefined,
        tags: ['sports'],
      },
      {
        title: undefined,
        text: 'Nothing happend',
      },
    ],
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    subtitle: undefined,
    text: 'Nothing happend',
    tags: ['sports'],
  }

  const ret = merge({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should skip non-objects', () => {
  const path = ['original', 'unknown', 'somethingelse', 'arr', 'perhaps']
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['news', 'politics'],
    },
    somethingelse: 35,
    arr: [],
    perhaps: null,
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Title 1',
    subtitle: undefined,
    text: 'And so this happened',
    tags: ['news', 'politics'],
  }

  const ret = merge({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should set object on paths in reverse', () => {
  const path = ['original', 'modified']
  const data = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    subtitle: undefined,
    text: 'And so this happened',
    tags: ['sports'],
  }
  const expected = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Better title',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['sports'],
    },
    modified: {
      id: 'ent1',
      $type: 'entry',
      title: 'Better title',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['sports'],
    },
  }

  const ret = merge({ path })(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})

test('should run pipelines and merge the result', () => {
  const path = [
    ['heading', '>title'],
    ['createdBy', '>author'],
    ['tags', '>sections[]'],
  ]
  const data = {
    heading: 'Entry 1',
    createdBy: 'johnf',
    createdAt: new Date('2021-07-01T07:11:33Z'),
    tags: ['popular', 'news'],
  }
  const expectedValue = {
    title: 'Entry 1',
    author: 'johnf',
    sections: ['popular', 'news'],
  }

  const ret = merge({ path })(options)(data, state)

  assert.deepEqual(ret, expectedValue)
})

test('should merge with existing object', () => {
  const path = [['.'], ['createdBy', '>heading'], ['heading', '>title']]
  const data = {
    heading: 'Entry 1',
    createdBy: 'johnf',
    createdAt: new Date('2021-07-01T07:11:33Z'),
    tags: ['popular', 'news'],
  }
  const expectedValue = {
    heading: 'johnf',
    title: 'Entry 1',
    createdBy: 'johnf',
    createdAt: new Date('2021-07-01T07:11:33Z'),
    tags: ['popular', 'news'],
  }

  const ret = merge({ path })(options)(data, state)

  assert.deepEqual(ret, expectedValue)
})

test('should merge with result from transformer', () => {
  const getObj: Transformer = () => () => () => ({
    item: {
      id: 'ent3',
      title: 'Title 3',
    },
  })
  const path = ['original', [{ $transform: 'getObj' }, 'item']]
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
    },
  }
  const options = { transformers: { getObj } }
  const expected = {
    id: 'ent3',
    $type: 'entry',
    title: 'Title 3',
  }

  const ret = merge({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

// Tests -- reverse

test('mergeRev should merge two objects in reverse', () => {
  const path = ['original', 'modified']
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['news', 'politics'],
    },
    modified: {
      id: 'ent1',
      title: 'Better title',
      text: undefined,
      tags: ['sports'],
    },
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    subtitle: undefined,
    text: 'And so this happened',
    tags: ['sports'],
  }

  const ret = mergeRev({ path })(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})

test('mergeRev should set object on paths going forward', () => {
  const path = ['original', 'modified']
  const data = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    subtitle: undefined,
    text: 'And so this happened',
    tags: ['sports'],
  }
  const expected = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Better title',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['sports'],
    },
    modified: {
      id: 'ent1',
      $type: 'entry',
      title: 'Better title',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['sports'],
    },
  }

  const ret = mergeRev({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

// Tests -- async

test('should merge with async pipelines', async () => {
  const path = ['original', 'modified']
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['news', 'politics'],
    },
    modified: {
      id: 'ent1',
      title: 'Better title',
      text: undefined,
      tags: ['sports'],
    },
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    subtitle: undefined,
    text: 'And so this happened',
    tags: ['sports'],
  }

  const ret = await mergeAsync({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should merge with result from async transformer', async () => {
  const getObj: AsyncTransformer = () => () => async () => ({
    item: {
      id: 'ent3',
      title: 'Title 3',
    },
  })
  const path = ['original', [{ $transform: 'getObj' }, 'item']]
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
    },
  }
  const options = { transformers: { getObj } }
  const expected = {
    id: 'ent3',
    $type: 'entry',
    title: 'Title 3',
  }

  const ret = await mergeAsync({ path })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('mergeRev should merge with async pipelines in reverse', async () => {
  const path = ['original', 'modified']
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
      subtitle: undefined,
      text: 'And so this happened',
      tags: ['news', 'politics'],
    },
    modified: {
      id: 'ent1',
      title: 'Better title',
      text: undefined,
      tags: ['sports'],
    },
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    subtitle: undefined,
    text: 'And so this happened',
    tags: ['sports'],
  }

  const ret = await mergeRevAsync({ path })(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})
