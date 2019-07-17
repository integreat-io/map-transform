import test from 'ava'
import { compose } from 'ramda'

import { get } from './getSet'

// Setup

const options = {}

// Tests

test('should get from path', (t) => {
  const data = { meta: { author: 'Someone' } }
  const state = {
    root: data,
    context: data,
    value: data
  }
  const expected = {
    root: data,
    context: data,
    value: 'Someone'
  }

  const ret = get('meta.author')(options)(state)

  t.deepEqual(ret, expected)
})

test('should be composable', (t) => {
  const data = {
    data: {
      items: [{ title: 'First item' }, { title: 'Second item' }]
    }
  }
  const state = {
    root: data,
    context: data,
    value: data
  }
  const expectedValue = 'Second item'

  const ret = compose(get('title')(options), get('data.items[1]')(options))(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should set value to undefined when path is missing on value', (t) => {
  const state = {
    root: {},
    context: {},
    value: {}
  }

  const ret = get('unknown.path')(options)(state)

  t.is(ret.value, undefined)
})

test('should set on path when reversed', (t) => {
  const state = {
    root: 'Someone',
    context: 'Someone',
    value: 'Someone',
    rev: true
  }
  const expected = {
    root: 'Someone',
    context: 'Someone',
    value: { meta: { author: 'Someone' } },
    rev: true
  }

  const ret = get('meta.author')(options)(state)

  t.deepEqual(ret, expected)
})

test('should get current value', (t) => {
  const state = {
    root: { id: 'ent1' },
    context: { id: 'ent1' },
    value: 'ent1'
  }

  const ret1 = get('.')(options)(state)
  const ret2 = get('')(options)(state)

  t.is(ret1.value, 'ent1')
  t.is(ret2.value, 'ent1')
})

test('should get from root path', (t) => {
  const state = {
    root: { section: 'news', items: [{ id: 'no1' }] },
    context: { id: 'no1' },
    value: { id: 'no1' }
  }
  const expectedValue = 'news'

  const ret = get('$section')(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should not set to root path', (t) => {
  const state = {
    root: { section: 'news', items: [{ id: 'no1' }] },
    context: { id: 'no1' },
    value: { id: 'no1' },
    rev: true
  }
  const expectedValue = undefined

  const ret = get('$section')(options)(state)

  t.deepEqual(ret.value, expectedValue)
})
