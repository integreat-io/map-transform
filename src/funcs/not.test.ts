import test from 'ava'
import { Data } from '../types'

import not from './not'

const returnIt = (value: Data) => !!value

test('should return true for false and vice versa', (t) => {
  t.true(not(returnIt)(false))
  t.false(not(returnIt)(true))
})
