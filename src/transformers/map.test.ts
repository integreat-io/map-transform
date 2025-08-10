import test from 'node:test'
import assert from 'node:assert/strict'
import type { Dictionary } from '../types.js'

import map from './map.js'

// Setup

const simple = [
  ['1', 'stripe'],
  ['2', 'paypal'],
] as Dictionary

const complex = [
  ['200', 'ok'],
  ['201', 'ok'],
  ['404', 'notfound'],
  ['404', 'noaction'],
  ['*', 'error'],
  ['500', '*'],
] as Dictionary

const selective = [
  ['LOCAL', 'NOK'],
  ['*', 'UNKNOWN'],
  ['*', '*'],
] as Dictionary

const withUndefined = [
  ['LOCAL', 'NOK'],
  ['*', undefined],
  [undefined, 'USD'],
] as Dictionary

const withUndefinedKeyword = [
  ['LOCAL', 'NOK'],
  ['*', '**undefined**'],
  ['**undefined**', 'USD'],
] as Dictionary

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

test('should map', async () => {
  const mapping = map({ dictionary: simple })(options)

  assert.equal(await mapping('1', state), 'stripe')
  assert.equal(await mapping('2', state), 'paypal')
  assert.equal(await mapping('0', state), undefined)
})

test('should map in reverse', async () => {
  const mapping = map({ dictionary: simple })(options)

  assert.equal(await mapping('stripe', stateRev), '1')
  assert.equal(await mapping('paypal', stateRev), '2')
  assert.equal(await mapping('shilling', stateRev), undefined)
})

test('should flip the direction of map going forward', async () => {
  const mapping = map({ dictionary: simple, flip: true })(options)

  assert.equal(await mapping('stripe', state), '1')
  assert.equal(await mapping('paypal', state), '2')
  assert.equal(await mapping('shilling', state), undefined)
})

test('should flip the direction of map in reverse', async () => {
  const mapping = map({ dictionary: simple, flip: true })(options)

  assert.equal(await mapping('1', stateRev), 'stripe')
  assert.equal(await mapping('2', stateRev), 'paypal')
  assert.equal(await mapping('0', stateRev), undefined)
})

test('should map with several alternatives and defaults', async (t) => {
  const mapping = map({ dictionary: complex })(options)

  assert.equal(await mapping('200', state), 'ok')
  assert.equal(await mapping('201', state), 'ok')
  assert.equal(await mapping('404', state), 'notfound')
  assert.equal(await mapping('500', state), 'error')
  assert.equal(await mapping('507', state), 'error')
})

test('should map with several alternatives and defaults in reverse', async () => {
  const mapping = map({ dictionary: complex })(options)

  assert.equal(await mapping('ok', stateRev), '200')
  assert.equal(await mapping('notfound', stateRev), '404')
  assert.equal(await mapping('noaction', stateRev), '404')
  assert.equal(await mapping('error', stateRev), '500')
  assert.equal(await mapping('timeout', stateRev), '500')
})

test('should pick first star', async () => {
  const mapping = map({ dictionary: selective })(options)

  assert.equal(await mapping('LOCAL', state), 'NOK')
  assert.equal(await mapping('EUR', state), 'UNKNOWN')
})

test('should map to source value for double star', async () => {
  const mapping = map({ dictionary: selective })(options)

  assert.equal(await mapping('NOK', stateRev), 'LOCAL')
  assert.equal(await mapping('EUR', stateRev), 'EUR')
  assert.equal(await mapping('USD', stateRev), 'USD')
})

test('should map to undefined when no dictionary', async () => {
  const mapping = map({})(options)

  assert.equal(await mapping('1', state), undefined)
  assert.equal(await mapping('2', stateRev), undefined)
})

test('should map disallowed dictionary values using star', async () => {
  const mapping = map({ dictionary: complex })(options)

  assert.equal(await mapping({}, state), 'error')
  assert.equal(await mapping(new Date(), state), 'error')
})

test('should map to and from undefined', async () => {
  const mapping = map({ dictionary: withUndefined })(options)

  assert.equal(await mapping('SEK', state), undefined)
  assert.equal(await mapping(undefined, state), 'USD')
  assert.equal(await mapping('LOCAL', state), 'NOK') // Just to verify
})

test('should map to and from undefined keyword', async () => {
  const mapping = map({ dictionary: withUndefinedKeyword })(options)

  assert.equal(await mapping('SEK', state), undefined)
  assert.equal(await mapping(undefined, state), 'USD')
  assert.equal(await mapping('LOCAL', state), 'NOK') // Just to verify
})

test('should map with named dictionary', async () => {
  const options = { dictionaries: { simple } }
  const mapping = map({ dictionary: 'simple' })(options)

  assert.equal(await mapping('1', state), 'stripe')
  assert.equal(await mapping('2', state), 'paypal')
  assert.equal(await mapping('0', state), undefined)
})
