import { Automatic, Channel } from "./channel";
import { Indices, setAtIndex } from "./indices";
import { IndexModifier } from "./modifiers";

export class Map<OutputType, InputType> extends Automatic<
  [InputType[]],
  OutputType[]
> {
  cached: OutputType[] = [];

  constructor(
    public incoming: Channel<InputType[]>,
    readonly mapFn: (inputElem: InputType) => OutputType
  ) {
    super(
      [incoming],
      [
        {
          setData: () => {
            this.updateMap.addAll();
            this.markDataNeedsUpdate();
          },
          setDataAtIndex: (index: Indices<InputType[]>) => {
            this.updateMap.addIndex(index as Indices<OutputType[]>);
            this.markIndexNeedsUpdate(index as Indices<OutputType[]>);
          },
          modifyIndicesHandler: (
            modifier: IndexModifier<Indices<InputType[]>>
          ) => {
            switch (modifier.type) {
              case "InsertModifier":
                this.cached.splice(modifier.index as number, 0, undefined!);
                this.updateMap.addIndex(
                  modifier.index as Indices<OutputType[]>
                );
                this.markIndexNeedsUpdate(
                  modifier.index as Indices<OutputType[]>
                );
            }
          },
        },
      ],
      {
        getData: () => {
          this.cached = this.incoming.getData().map((x) => this.mapFn(x));
        },
        getDataAtIndex: (index: Indices<OutputType[]>) => {
          setAtIndex(
            this.cached,
            index,
            this.mapFn(
              incoming.getDataAtIndex(
                index as Indices<InputType[]>
              ) as InputType
            ) as any
          );
        },
      }
    );
  }
}
