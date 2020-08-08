import test from 'ava'
import { Dictionary } from '../types'

import map from './map'

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

const context = { rev: false, onlyMappedValues: false }
const contextRev = { rev: true, onlyMappedValues: false }

// Tests

test('should map', (t) => {
  const mapping = map({ dictionary: simple })

  t.is(mapping('1', context), 'stripe')
  t.is(mapping('2', context), 'paypal')
  t.is(mapping('0', context), undefined)
})

test('should map in reverse', (t) => {
  const mapping = map({ dictionary: simple })

  t.is(mapping('stripe', contextRev), '1')
  t.is(mapping('paypal', contextRev), '2')
  t.is(mapping('shilling', contextRev), undefined)
})

test('should map with several alternatives and defaults', (t) => {
  const mapping = map({ dictionary: complex })

  t.is(mapping('200', context), 'ok')
  t.is(mapping('201', context), 'ok')
  t.is(mapping('404', context), 'notfound')
  t.is(mapping('500', context), 'error')
  t.is(mapping('507', context), 'error')
})

test('should map with several alternatives and defaults in reverse', (t) => {
  const mapping = map({ dictionary: complex })

  t.is(mapping('ok', contextRev), '200')
  t.is(mapping('notfound', contextRev), '404')
  t.is(mapping('noaction', contextRev), '404')
  t.is(mapping('error', contextRev), '500')
  t.is(mapping('timeout', contextRev), '500')
})

test('should pick first star', (t) => {
  const mapping = map({ dictionary: selective })

  t.is(mapping('LOCAL', context), 'NOK')
  t.is(mapping('EUR', context), 'UNKNOWN')
})

test('should map to source value for double star', (t) => {
  const mapping = map({ dictionary: selective })

  t.is(mapping('NOK', contextRev), 'LOCAL')
  t.is(mapping('EUR', contextRev), 'EUR')
  t.is(mapping('USD', contextRev), 'USD')
})

test('should map to undefined when no dictionary', (t) => {
  const mapping = map({})

  t.is(mapping('1', context), undefined)
  t.is(mapping('2', contextRev), undefined)
})

test('should map disallowed dictionary values using star', (t) => {
  const mapping = map({ dictionary: complex })

  t.is(mapping({}, context), 'error')
  t.is(mapping(new Date(), context), 'error')
})

test('should map with named dictionary', (t) => {
  const options = { dictionaries: { simple } }
  const mapping = map({ dictionary: 'simple' }, options)

  t.is(mapping('1', context), 'stripe')
  t.is(mapping('2', context), 'paypal')
  t.is(mapping('0', context), undefined)
})
