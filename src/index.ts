import * as R from 'ramda'
import {
  createMapper,
  MapperFunction,
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

  export interface Definition {
    mapping?: Shape,
    path?: PathString | null,
    pathRev?: PathString | null,
    pathTo?: PathString | null,
    pathToRev?: PathString | null,
    transform?: TransformPipeline,
    transformRev?: TransformPipeline,
    filter?: FilterPipeline
  }

  type DataProperty = string | number | boolean | object

  export interface DataWithProps {
    [key: string]: DataProperty | DataProperty[]
  }

  export type Data = DataWithProps | DataWithProps[] | DataProperty | DataProperty[]
}

const noTransform: MapperFunction = (data: mapTransform.Data | null) => data
const noTransformWithRev: MapperFunctionWithRev = Object.assign(noTransform, { rev: R.identity })

/**
 * Will return a function that executes the mapping defined in `mapping`.
 * When no mapping is provided, an identity function is returned.
 *
 * @param {Object} definition - A mapping definition
 * @returns {function} A mapper function
 */
function mapTransform (definition?: mapTransform.Definition | null): MapperFunctionWithRev {
  return (definition) ? createMapper(definition) : noTransformWithRev
}

export = mapTransform
