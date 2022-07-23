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
            this.needsFullUpdate = true;
          },
          setDataAtIndex: (index: Indices<InputType[]>) => {
            this.updateMap[index as Indices<OutputType[]>] = true;
          },
          modifyIndicesHandler: (index: IndexModifier) => {
            throw new Error("not yet implemented");
          },
        },
      ],
      {
        getData: () => {
          this.cached = this.incoming.getData().map((x) => this.mapFn(x));
          this.needsFullUpdate = false;
        },
        getDataAtIndex: (index: Indices<OutputType[]>) => {
          if (this.updateMap[index]) {
            setAtIndex(
              this.cached,
              index,
              this.mapFn(
                incoming.getDataAtIndex(
                  index as Indices<InputType[]>
                ) as InputType
              ) as any
            );
          }
          this.updateMap[index] = false;
        },
      }
    );
  }
}
