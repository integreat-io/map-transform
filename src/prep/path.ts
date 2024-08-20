import type { Path } from '../types.js'

function splitPart(part: string): string[] {
  if (part[0] === '^' && part.length > 1) {
    // The part starts with '^^' or the obsolete '^' root prefix.
    // Note that this obsolete prefix will be removed in future versions.
    const rest = part.slice(part[1] === '^' ? 2 : 1) // Extract the rest of the part
    return [
      '^^', // Return the root part
      ...splitPart(rest), // Split up the rest of the part if necessary
    ]
  } else {
    const indexOfBracket = part.indexOf('[')
    if (indexOfBracket >= 0 && part[indexOfBracket - 1] !== '\\') {
      const indexOfClosingBracket = part.indexOf(']', indexOfBracket)
      return [
        part.slice(0, indexOfBracket), // Any path before the bracket
        part.slice(indexOfBracket, indexOfClosingBracket + 1), // The array part
        ...splitPart(part.slice(indexOfClosingBracket + 1)), // Any path after the bracket -- usually more brackets
      ]
    } else {
      return [part]
    }
  }
}

const escapeRegex = /\\(?!\\)/g
const unescape = (path: Path) => path.replace(escapeRegex, '')

const removeGetIndicator = (path: Path) =>
  path[0] === '<' ? path.slice(1) : path

export default function preparePathStep(path: Path) {
  if (path[0] === '>') {
    return path
      .slice(1)
      .split('.')
      .flatMap(splitPart)
      .map(unescape)
      .filter(Boolean) // Remove any empty parts
      .map((part) => `>${part}`)
      .reverse()
  } else {
    return removeGetIndicator(path)
      .split('.')
      .flatMap(splitPart)
      .map(unescape)
      .filter(Boolean) // Remove any empty parts
  }
}
