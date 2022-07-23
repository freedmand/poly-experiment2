import { Flatten, Indices, getAtIndex, setAtIndex } from "./indices";
import { IndexModifier } from "./modifiers";

type EnforceArray<T> = T extends any[] ? T : never;
type ChannelMap<T extends any[] | [any]> = EnforceArray<{
  [K in keyof T]: Channel<T[K]>;
}>;
type SetHandler<Type> = {
  /**
   * A handler for setting the data of an incoming channel
   * @param index The index that is updated for the incoming channel
   */
  readonly setDataAtIndex: <U extends Indices<Type>>(index: U) => void;
  /**
   * A handler for setting the data of an incoming channel
   */
  readonly setData: () => void;
  /**
   * A handler for dealing with index modification operations
   * @param indexModifier The index modification operation
   */
  readonly modifyIndicesHandler: (indexModifier: IndexModifier) => void;
};

type HandlerMap<T extends any[] | [any]> = EnforceArray<{
  [K in keyof T]: SetHandler<T[K]>;
}>;

/**
 * A channel is an abstract class that provides typed data
 */
export abstract class Channel<Type> {
  /**
   * Gets all the data the channel holds
   */
  abstract getData(): Type;

  /**
   * Gets the data element at the specified index
   * @param index The index of data to retrieve
   */
  abstract getDataAtIndex<T extends Indices<Type>>(index: T): Flatten<Type>[T];

  /**
   * A list of outgoing connections for the channel. When data is updated,
   * outgoing connections will get notified.
   *
   * Each outgoing connection maps which incoming connection corresponds to this
   * channel.
   */
  public outgoingConnections: {
    incomingConnectionIndex: number;
    channel: Automatic<any, any>;
  }[] = [];

  pingData(): void {
    for (const { incomingConnectionIndex, channel } of this
      .outgoingConnections) {
      (
        channel.setHandlers[incomingConnectionIndex] as SetHandler<Type>
      ).setData();
    }
  }

  pingDataAtIndex<T extends Indices<Type>>(index: T): void {
    for (const { incomingConnectionIndex, channel } of this
      .outgoingConnections) {
      (
        channel.setHandlers[incomingConnectionIndex] as SetHandler<Type>
      ).setDataAtIndex(index);
    }
  }
}

export abstract class Automatic<
  IncomingTypes extends any[] | [any],
  OutgoingType
> extends Channel<OutgoingType> {
  /**
   * The cached data for the channel (starts out undefined)
   */
  public cached: OutgoingType = undefined!;
  /**
   * Which indices need updating
   */
  public updateMap: { [index in Indices<OutgoingType>]: boolean } = {} as {
    [index in Indices<OutgoingType>]: boolean;
  };
  /**
   * Whether a full update is required
   */
  public needsFullUpdate = true;
  /**
   *
   * @param incoming The list of incoming channels
   * @param outgoing The outgoing channel the connection produces
   * @param setHandlers The handlers for setting data for each incoming channel.
   * These handlers should only affect the outgoing channel's cached and
   * needsUpdate properties
   * @param getHandlers The handlers for getting data from the outgoing channel.
   */
  constructor(
    readonly incomingChannels: ChannelMap<IncomingTypes>,
    readonly setHandlers: HandlerMap<IncomingTypes>,
    readonly getHandlers: {
      /**
       * A handler for loading all the into the cache
       */
      readonly getData: () => void;
      /**
       * A handler for loading the data for the cache at a specified index
       */
      readonly getDataAtIndex: <T extends Indices<OutgoingType>>(
        index: T
      ) => void;
    }
  ) {
    super();

    // Connect incoming channels
    // TODO: unsubscribe mechanism
    // TODO: centralize this logic
    for (const incomingChannel of this.incomingChannels) {
      incomingChannel.outgoingConnections.push({
        incomingConnectionIndex: incomingChannel.outgoingConnections.length,
        channel: this,
      });
    }
  }

  retrieveFromCache(): OutgoingType {
    if (this.needsFullUpdate || Object.values(this.updateMap).some((x) => x)) {
      throw new Error(
        `Expected channel to be fully cached (${
          this.needsFullUpdate
        }, ${JSON.stringify(this.updateMap)})`
      );
    }
    return this.cached;
  }

  getData(): OutgoingType {
    this.getHandlers.getData();
    return this.retrieveFromCache();
  }

  getDataAtIndex<T extends Indices<OutgoingType>>(
    index: T
  ): Flatten<OutgoingType>[T] {
    this.getHandlers.getDataAtIndex(index);
    return getAtIndex(this.retrieveFromCache(), index);
  }
}

/**
 * Data is a typed data channel that can be subscribed to in order to listen for changes
 */
export class Data<Type> extends Channel<Type> {
  constructor(public data: Type) {
    super();
  }

  setData(newData: Type) {
    this.data = newData;
    this.pingData();
  }

  getData(): Type {
    return this.data;
  }

  getDataAtIndex<T extends Indices<Type>>(index: T): Flatten<Type>[T] {
    return getAtIndex(this.data, index);
  }

  setDataAtIndex<T extends Indices<Type>>(index: T, newData: Flatten<Type>[T]) {
    setAtIndex(this.data, index, newData);
    this.pingDataAtIndex(index);
  }
}
