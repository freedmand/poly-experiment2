import { Automatic, Connection, Channel } from "./channel";
import { Indices, setAtIndex } from "./indices";
import { IndexModifier } from "./modifiers";

export class Map<OutputType, InputType> extends Automatic<OutputType[]> {
  constructor(
    public incoming: Channel<InputType[]>,
    readonly mapFn: (inputElem: InputType) => OutputType
  ) {
    super([]);
    this.connections = [
      new Connection(
        incoming,
        this,
        () => {
          this.needsFullUpdate = true;
        },
        () => {
          this.cached = this.incoming.getData().map((x) => this.mapFn(x));
          this.needsFullUpdate = false;
        },
        (index: Indices<OutputType[]>) => {
          this.updateMap[index] = true;
        },
        (index: Indices<OutputType[]>) => {
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
        (indexModifier: IndexModifier) => {
          throw new Error("not yet implemented");
        }
      ),
    ];
    for (const connection of this.connections) {
      connection.setDataHandler();
    }
  }
}
