import { Automatic, Channel } from "./channel";
import { Indices, setAtIndex } from "./indices";
import { IndexModifier } from "./modifiers";

export class Map<OutputType, InputType> extends Automatic<
  [InputType[]],
  OutputType[]
> {
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
          modifyIndicesHandler: (index: IndexModifier) => {
            throw new Error("not yet implemented");
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
