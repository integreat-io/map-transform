import test from 'ava'

import lookup from './lookup'

// Setup

const options = {}

// Tests

test('should lookup data', (t) => {
  const data = {
    content: { author: 'user2' },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' }
      ]
    }
  }
  const state = {
    root: data,
    context: 'user2',
    value: 'user2'
  }
  const expected = {
    root: data,
    context: 'user2',
    value: { id: 'user2', name: 'User 2' }
  }

  const ret = lookup('^related.users[]', 'id')(options)(state)

  t.deepEqual(ret, expected)
})

test('should lookup array of data', (t) => {
  const data = {
    content: { authors: ['user1', 'user3'] },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' }
      ]
    }
  }
  const state = {
    root: data,
    context: data.content.authors,
    value: data.content.authors
  }
  const expected = {
    root: data,
    context: data.content.authors,
    value: [{ id: 'user1', name: 'User 1' }, {  id: 'user3', name: 'User 3' }]
  }

  const ret = lookup('^related.users[]', 'id')(options)(state)

  t.deepEqual(ret, expected)
})

test('should set value to undefined when missing array', (t) => {
  const data = {
    content: { author: 'user2' }
  }
  const state = {
    root: data,
    context: 'user2',
    value: 'user2'
  }

  const ret = lookup('^related.users', 'id')(options)(state)

  t.is(ret.value, undefined)
})

test('should set value to undefined when no match', (t) => {
  const data = {
    content: { author: 'user3' },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' }
      ]
    }
  }
  const state = {
    root: data,
    context: 'user3',
    value: 'user3'
  }

  const ret = lookup('^related.users[]', 'id')(options)(state)

  t.is(ret.value, undefined)
})

test('should get lookup prop in reverse', (t) => {
  const data = { id: 'user2', name: 'User 2' }
  const state = {
    root: data,
    context: data,
    value: data,
    rev: true
  }
  const expected = {
    root: data,
    context: data,
    value: 'user2',
    rev: true
  }

  const ret = lookup('^related.users[]', 'id')(options)(state)

  t.deepEqual(ret, expected)
})

test('should get lookup prop on array in reverse', (t) => {
  const data = [{ id: 'user1', name: 'User 1' }, { id: 'user2', name: 'User 2' }]
  const state = {
    root: data,
    context: data,
    value: data,
    rev: true
  }
  const expected = {
    root: data,
    context: data,
    value: ['user1', 'user2'],
    rev: true
  }

  const ret = lookup('^related.users[]', 'id')(options)(state)

  t.deepEqual(ret, expected)
})
