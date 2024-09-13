import type { Path } from '../types.js'

// We check if the bracket is escaped. If it is, we check if the escape is
// escaped, in which case the bracket is not escaped after all.
function isEscaped(part: string, index: number) {
  if (part[index - 1] === '\\') {
    let count = 1
    while (part[index - 1 - count] === '\\') {
      // Count how many escapes we have in-front of our bracket
      count++
    }
    return count % 2 === 1 // If the number is odd, we have an escape
  } else {
    return false
  }
  // && part[index - 2] !== '\\'
}

function splitPart(part: string): string[] {
  if (part === '$modify') {
    return ['...']
  } else if (part[0] === '^' && part.length > 1) {
    // The part starts with '^^' or the obsolete '^' root prefix.
    // Note that this obsolete prefix will be removed in future versions.
    const rest = part.slice(part[1] === '^' ? 2 : 1) // Extract the rest of the part
    return [
      '^^', // Return the root part
      ...splitPart(rest), // Split up the rest of the part if necessary
    ]
  } else {
    const indexOfBracket = part.indexOf('[')
    if (indexOfBracket >= 0 && !isEscaped(part, indexOfBracket)) {
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

const escapeRegex = /\\(.)/g
const unescape = (path: Path) => path.replace(escapeRegex, '$1') // Replace an escaped value with the value

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
