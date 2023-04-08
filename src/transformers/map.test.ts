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

test('should map', (t) => {
  const mapping = map({ dictionary: simple })(options)

  t.is(mapping('1', state), 'stripe')
  t.is(mapping('2', state), 'paypal')
  t.is(mapping('0', state), undefined)
})

test('should map in reverse', (t) => {
  const mapping = map({ dictionary: simple })(options)

  t.is(mapping('stripe', stateRev), '1')
  t.is(mapping('paypal', stateRev), '2')
  t.is(mapping('shilling', stateRev), undefined)
})

test('should map with several alternatives and defaults', (t) => {
  const mapping = map({ dictionary: complex })(options)

  t.is(mapping('200', state), 'ok')
  t.is(mapping('201', state), 'ok')
  t.is(mapping('404', state), 'notfound')
  t.is(mapping('500', state), 'error')
  t.is(mapping('507', state), 'error')
})

test('should map with several alternatives and defaults in reverse', (t) => {
  const mapping = map({ dictionary: complex })(options)

  t.is(mapping('ok', stateRev), '200')
  t.is(mapping('notfound', stateRev), '404')
  t.is(mapping('noaction', stateRev), '404')
  t.is(mapping('error', stateRev), '500')
  t.is(mapping('timeout', stateRev), '500')
})

test('should pick first star', (t) => {
  const mapping = map({ dictionary: selective })(options)

  t.is(mapping('LOCAL', state), 'NOK')
  t.is(mapping('EUR', state), 'UNKNOWN')
})

test('should map to source value for double star', (t) => {
  const mapping = map({ dictionary: selective })(options)

  t.is(mapping('NOK', stateRev), 'LOCAL')
  t.is(mapping('EUR', stateRev), 'EUR')
  t.is(mapping('USD', stateRev), 'USD')
})

test('should map to undefined when no dictionary', (t) => {
  const mapping = map({})(options)

  t.is(mapping('1', state), undefined)
  t.is(mapping('2', stateRev), undefined)
})

test('should map disallowed dictionary values using star', (t) => {
  const mapping = map({ dictionary: complex })(options)

  t.is(mapping({}, state), 'error')
  t.is(mapping(new Date(), state), 'error')
})

test('should map to and from undefined', (t) => {
  const mapping = map({ dictionary: withUndefined })(options)

  t.is(mapping('SEK', state), undefined)
  t.is(mapping(undefined, state), 'USD')
  t.is(mapping('LOCAL', state), 'NOK') // Just to verify
})

test('should map with named dictionary', (t) => {
  const options = { dictionaries: { simple } }
  const mapping = map({ dictionary: 'simple' })(options)

  t.is(mapping('1', state), 'stripe')
  t.is(mapping('2', state), 'paypal')
  t.is(mapping('0', state), undefined)
})
