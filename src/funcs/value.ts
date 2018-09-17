import { set, lensProp } from 'ramda'
import { Data, MapFunction } from '../types'

export default function value (val: Data): MapFunction {
  return set(lensProp('value'), val)
}
