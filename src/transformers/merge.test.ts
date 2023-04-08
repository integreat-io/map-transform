import test from 'ava'

import merge from './merge.js'

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

test('should merge two objects', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should merge three objects', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should return one object', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should merge array of objects', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should merge object and array of objects', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should skip non-objects', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should merge in reverse', (t) => {
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

  const ret = merge({ path })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})
