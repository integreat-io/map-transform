// Definitions file for map-transform
declare function mapTransform (mapping: object): (data: object) => object

export interface IFieldMapping {
  path: string,
  default?: any,
  defaultRev?: any
}

export interface IMapping {
  fields: {
    [key: string]: string | IFieldMapping
  },
  path?: string,
  pathTo?: string
}

type IDataProperty = string | number | object

interface IDataWithProps {
  [key: string]: IDataProperty | IDataProperty[]
}

export type IData = IDataWithProps | {}

export type IFieldMapper = (target: IData, data: IData) => IData

export default mapTransform
