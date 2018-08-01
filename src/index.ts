import * as R from 'ramda'
import {
  createMapper,
  MapperFunctionWithRev
} from './utils/createMapper'
import { PathString } from './utils/lensPath'
import { MappingDef } from './utils/normalizeMapping'
import { TransformPipeline } from './utils/transformPipeline'
import { FilterPipeline } from './utils/filterPipeline'

namespace mapTransform {
  export interface Shape {
    [key: string]: PathString | MappingDef | Shape | null
  }

  export interface DefinitionNormalized {
    pathFrom?: PathString | null,
    pathFromRev?: PathString | null,
    filterFrom?: FilterPipeline,
    filterFromRev?: FilterPipeline,
    transformFrom?: TransformPipeline,
    transformFromRev?: TransformPipeline,
    mapping?: Shape,
    transformTo?: TransformPipeline,
    transformToRev?: TransformPipeline,
    filterTo?: FilterPipeline,
    filterToRev?: FilterPipeline,
    pathTo?: PathString | null,
    pathToRev?: PathString | null
  }

  export interface Definition extends DefinitionNormalized {
    path?: PathString | null,
    pathRev?: PathString | null,
    transform?: TransformPipeline,
    transformRev?: TransformPipeline,
    filter?: FilterPipeline,
    filterRev?: FilterPipeline,
  }

  type DataProperty = string | number | boolean | object

  export interface DataWithProps {
    [key: string]: DataProperty | DataProperty[]
  }

  export type Data = DataWithProps | DataWithProps[] | DataProperty | DataProperty[]
}

const identityMapper: MapperFunctionWithRev = Object.assign(
  (data: mapTransform.Data | null) => data,
  {
    noDefaults: R.identity,
    rev: Object.assign(
      (data: mapTransform.Data | null) => data,
      { noDefaults: R.identity }
    )
  }
)

/**
 * Will return a function that executes the mapping defined in `mapping`.
 * When no mapping is provided, an identity function is returned.
 *
 * @param {Object} definition - A mapping definition
 * @returns {function} A mapper function
 */
function mapTransform (definition?: mapTransform.Definition | null): MapperFunctionWithRev {
  return (definition) ? createMapper(definition) : identityMapper
}

export = mapTransform
