export type IndexModifier = InsertModifier;

export interface InsertModifier {
  type: "InsertModifier";
  index: number;
}
