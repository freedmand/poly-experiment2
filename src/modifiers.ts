import { Indices } from "./indices";

export type IndexModifier<T> = InsertModifier<T>;

export interface InsertModifier<T> {
  type: "InsertModifier";
  index: T;
}
