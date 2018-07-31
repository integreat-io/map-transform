import { Shape } from '..'
import { PathString } from './lensPath'
import { TransformPipeline } from './transformPipeline'

interface MappingDefBase {
  path: PathString | null,
  transform?: TransformPipeline,
  transformRev?: TransformPipeline,
  default?: any,
  defaultRev?: any
}

export interface MappingDefNormalized extends MappingDefBase {
  pathTo: PathString | null,
}

export interface MappingDef extends MappingDefBase {
  pathTo?: PathString | null,
}

const normalize = (def: MappingDef): MappingDefNormalized =>
    ({ ...def, path: def.path || null, pathTo: def.pathTo || null })

const normalizeDef = (pathArr: PathString[], def: MappingDef | PathString):
    MappingDefNormalized =>
  (typeof def === 'string')
    ? normalize({ path: def, pathTo: pathArr.join('.') })
    : normalize({ ...def, pathTo: pathArr.join('.') })

const isMappingDef = (obj: Shape | PathString | MappingDef | null) =>
  obj && typeof obj === 'object' && typeof (obj as MappingDef).path !== 'string'

const normalizeShape = (mapping: Shape, pathTo: string[] = []):
    MappingDefNormalized[] =>
  Object.keys(mapping).reduce((arr: MappingDefNormalized[], key: PathString) =>
    (isMappingDef(mapping[key]))
      ? [ ...arr, ...normalizeShape(mapping[key] as Shape, [...pathTo, key]) ]
      : [ ...arr, normalizeDef([...pathTo, key], mapping[key] as MappingDef)]
  , []
)

export function normalizeMapping (mapping: Shape | MappingDef[]):
    MappingDefNormalized[] {
  const normalized = (Array.isArray(mapping))
    ? mapping.map(normalize)
    : normalizeShape(mapping)
  return normalized.filter((m) => m.path !== null && m.pathTo !== null)
}
