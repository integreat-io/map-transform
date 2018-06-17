// Definitions file for map-transform
declare function mapTransform (mapping: object): (data: object) => object

export type IPath = string

export interface IFieldMapping {
  path: IPath | null,
  default?: any,
  defaultRev?: any
}

export interface IMapping {
  fields?: {
    [key: string]: IPath | IFieldMapping | null
  },
  path?: IPath | null,
  pathRev?: IPath | null,
  pathTo?: IPath | null,
  pathToRev?: IPath | null
}

type IDataProperty = string | number | object

export interface IDataWithProps {
  [key: string]: IDataProperty | IDataProperty[]
}

export type IData = IDataWithProps | {}

export type IDataOrProp = IData | string | number

export type IFieldMapper = (target: IData, data: IData) => IData

export default mapTransform
