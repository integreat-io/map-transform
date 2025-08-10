import test from 'ava'
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

test('should map', async (t) => {
  const mapping = map({ dictionary: simple })(options)

  t.is(await mapping('1', state), 'stripe')
  t.is(await mapping('2', state), 'paypal')
  t.is(await mapping('0', state), undefined)
})

test('should map in reverse', async (t) => {
  const mapping = map({ dictionary: simple })(options)

  t.is(await mapping('stripe', stateRev), '1')
  t.is(await mapping('paypal', stateRev), '2')
  t.is(await mapping('shilling', stateRev), undefined)
})

test('should flipt the direction of map going forward', async (t) => {
  const mapping = map({ dictionary: simple, flip: true })(options)

  t.is(await mapping('stripe', state), '1')
  t.is(await mapping('paypal', state), '2')
  t.is(await mapping('shilling', state), undefined)
})

test('should flip the direction of map in reverse', async (t) => {
  const mapping = map({ dictionary: simple, flip: true })(options)

  t.is(await mapping('1', stateRev), 'stripe')
  t.is(await mapping('2', stateRev), 'paypal')
  t.is(await mapping('0', stateRev), undefined)
})

test('should map with several alternatives and defaults', async (t) => {
  const mapping = map({ dictionary: complex })(options)

  t.is(await mapping('200', state), 'ok')
  t.is(await mapping('201', state), 'ok')
  t.is(await mapping('404', state), 'notfound')
  t.is(await mapping('500', state), 'error')
  t.is(await mapping('507', state), 'error')
})

test('should map with several alternatives and defaults in reverse', async (t) => {
  const mapping = map({ dictionary: complex })(options)

  t.is(await mapping('ok', stateRev), '200')
  t.is(await mapping('notfound', stateRev), '404')
  t.is(await mapping('noaction', stateRev), '404')
  t.is(await mapping('error', stateRev), '500')
  t.is(await mapping('timeout', stateRev), '500')
})

test('should pick first star', async (t) => {
  const mapping = map({ dictionary: selective })(options)

  t.is(await mapping('LOCAL', state), 'NOK')
  t.is(await mapping('EUR', state), 'UNKNOWN')
})

test('should map to source value for double star', async (t) => {
  const mapping = map({ dictionary: selective })(options)

  t.is(await mapping('NOK', stateRev), 'LOCAL')
  t.is(await mapping('EUR', stateRev), 'EUR')
  t.is(await mapping('USD', stateRev), 'USD')
})

test('should map to undefined when no dictionary', async (t) => {
  const mapping = map({})(options)

  t.is(await mapping('1', state), undefined)
  t.is(await mapping('2', stateRev), undefined)
})

test('should map disallowed dictionary values using star', async (t) => {
  const mapping = map({ dictionary: complex })(options)

  t.is(await mapping({}, state), 'error')
  t.is(await mapping(new Date(), state), 'error')
})

test('should map to and from undefined', async (t) => {
  const mapping = map({ dictionary: withUndefined })(options)

  t.is(await mapping('SEK', state), undefined)
  t.is(await mapping(undefined, state), 'USD')
  t.is(await mapping('LOCAL', state), 'NOK') // Just to verify
})

test('should map to and from undefined keyword', async (t) => {
  const mapping = map({ dictionary: withUndefinedKeyword })(options)

  t.is(await mapping('SEK', state), undefined)
  t.is(await mapping(undefined, state), 'USD')
  t.is(await mapping('LOCAL', state), 'NOK') // Just to verify
})

test('should map with named dictionary', async (t) => {
  const options = { dictionaries: { simple } }
  const mapping = map({ dictionary: 'simple' })(options)

  t.is(await mapping('1', state), 'stripe')
  t.is(await mapping('2', state), 'paypal')
  t.is(await mapping('0', state), undefined)
})
