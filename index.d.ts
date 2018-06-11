// Definitions file for map-transform
declare function mapTransform (mapping: object): (data: object) => object

export type IPath = string | null

export interface IFieldMapping {
  path: IPath,
  default?: any,
  defaultRev?: any
}

export interface IMapping {
  fields?: {
    [key: string]: IPath | IFieldMapping
  },
  path?: IPath,
  pathRev?: IPath,
  pathTo?: IPath,
  pathToRev?: IPath
}

type IDataProperty = string | number | object

interface IDataWithProps {
  [key: string]: IDataProperty | IDataProperty[]
}

export type IData = IDataWithProps | {}

export type IFieldMapper = (target: IData, data: IData) => IData

export default mapTransform
