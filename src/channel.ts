import { Flatten, Indices, getAtIndex, setAtIndex } from "./indices";
import { IndexModifier } from "./modifiers";

/**
 * The connection class maps input and output channels
 */
export class Connection<IncomingType, OutgoingType> {
  /**
   *
   * @param incoming The list of incoming channels
   * @param outgoing The outgoing channel the connection produces
   * @param setDataHandler A handler for setting the data of one or more incoming channels
   * @param setDataAtIndexHandler A handler for setting the data at certain indices of one or more incoming channels
   * @param modifyIndicesHandler A handler for modifying indices of one or more incoming channels
   */
  constructor(
    readonly incoming: Channel<IncomingType>,
    readonly outgoing: Automatic<OutgoingType>,
    readonly setDataHandler: () => void,
    readonly getDataHandler: () => void,
    readonly setDataAtIndexHandler: <T extends Indices<OutgoingType>>(
      index: T
    ) => void,
    readonly getDataAtIndexHandler: <T extends Indices<OutgoingType>>(
      index: T
    ) => void,
    readonly modifyIndicesHandler: (indexModifier: IndexModifier) => void
  ) {}
}

/**
 * A channel is an abstract class that provides typed data
 */
export interface Channel<Type> {
  /**
   * Gets all the data the channel holds
   */
  getData(): Type;

  /**
   * Gets the data element at the specified index
   * @param index The index of data to retrieve
   */
  getDataAtIndex<T extends Indices<Type>>(index: T): Flatten<Type>[T];
}

export abstract class Automatic<Type> implements Channel<Type> {
  /**
   * The cached data for the channel (starts out undefined)
   */
  public cached: Type = undefined!;
  /**
   * Which indices need updating
   */
  public updateMap: { [index in Indices<Type>]: boolean } = {} as {
    [index in Indices<Type>]: boolean;
  };
  /**
   * Whether a full update is required
   */
  public needsFullUpdate = true;

  constructor(public connections: Connection<any, Type>[] = []) {}

  retrieveFromCache(): Type {
    if (this.needsFullUpdate || Object.values(this.updateMap).some((x) => x)) {
      throw new Error(
        `Expected channel to be fully cached (${
          this.needsFullUpdate
        }, ${JSON.stringify(this.updateMap)})`
      );
    }
    return this.cached;
  }

  getData(): Type {
    for (const connection of this.connections) {
      connection.getDataHandler();
    }
    return this.retrieveFromCache();
  }

  getDataAtIndex<T extends Indices<Type>>(index: T): Flatten<Type>[T] {
    for (const connection of this.connections) {
      connection.getDataAtIndexHandler(index);
    }
    return getAtIndex(this.retrieveFromCache(), index);
  }
}

/**
 * Data is a typed data channel that can be subscribed to in order to listen for changes
 */
export class Data<Type> implements Channel<Type> {
  constructor(public data: Type) {}

  setData(newData: Type) {
    this.data = newData;
  }

  getData(): Type {
    return this.data;
  }

  getDataAtIndex<T extends Indices<Type>>(index: T): Flatten<Type>[T] {
    return getAtIndex(this.data, index);
  }

  setDataAtIndex<T extends Indices<Type>>(index: T, newData: Flatten<Type>[T]) {
    setAtIndex(this.data, index, newData);
  }
}
