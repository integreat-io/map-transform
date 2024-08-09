import type { Path } from '../types.js'

export type Step = Path
export type Pipeline = Step[]
export type Def = Step | Pipeline
export type DataMapper = (value: unknown) => unknown
export type PreppedPipeline = Path[]

function splitPart(part: string): string[] {
  if (part.startsWith('^^')) {
    return [
      '^^', // Return the root part
      ...splitPart(part.slice(2)), // Split up the rest of the part if necessary
    ]
  } else {
    const indexOfBracket = part.indexOf('[')
    if (indexOfBracket >= 0) {
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

const removeGetIndicator = (path: Path) =>
  path[0] === '<' ? path.slice(1) : path

function prepPath(path: Path) {
  if (path[0] === '>') {
    return path
      .slice(1)
      .split('.')
      .flatMap(splitPart)
      .filter(Boolean) // Remove any empty parts
      .map((part) => `>${part}`)
      .reverse()
  } else {
    return removeGetIndicator(path)
      .split('.')
      .flatMap(splitPart)
      .filter(Boolean) // Remove any empty parts
  }
}

const ensurePipeline = (def: Def): Pipeline =>
  Array.isArray(def) ? def : [def]

export default function prep(def: Def): PreppedPipeline {
  return ensurePipeline(def).flatMap(prepPath)
}
