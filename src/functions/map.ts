import mapAny = require('map-any')
import {
  Data,
  Dictionary,
  DictionaryValue,
  Dictionaries,
  DataMapper,
} from '../types'

interface Operands {
  dictionary?: Dictionary | string
}

const isSupportedValue = (data: Data): data is DictionaryValue =>
  ['string', 'number', 'boolean'].includes(typeof data) ||
  data === null ||
  data === undefined

function findFirstMatch(
  value: DictionaryValue,
  dictionary: Dictionary,
  direction: 0 | 1
) {
  // eslint-disable-next-line security/detect-object-injection
  const match = dictionary.find((dict) => dict[direction] === value)
  return match ? match[1 - direction] : undefined
}

function translate(data: Data, dictionary: Dictionary, rev: boolean) {
  const direction = Number(rev) as 0 | 1
  return mapAny((data: Data) => {
    const value = isSupportedValue(data) ? data : undefined
    const match = findFirstMatch(value, dictionary, direction)
    if (match === undefined || match === '*') {
      const starMatch = findFirstMatch('*', dictionary, direction)
      return starMatch === undefined ? match : starMatch
    }
    return match
  }, data)
}

function extractDictionary(
  dictionary?: Dictionary | string,
  dictionaries?: Dictionaries
) {
  if (typeof dictionary === 'string') {
    return dictionaries && dictionaries[dictionary] // eslint-disable-line security/detect-object-injection
  } else {
    return dictionary
  }
}

export default function map(
  operands: Operands,
  options?: { dictionaries?: Dictionaries }
): DataMapper {
  const dictionary = extractDictionary(
    operands.dictionary,
    options && options.dictionaries
  )
  if (!dictionary) {
    return () => undefined
  }
  return (data, context) => {
    const { rev } = context
    const match = translate(data, dictionary, rev)
    return match === '*' ? data : match
  }
}
