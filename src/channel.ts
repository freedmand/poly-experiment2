import { Flatten, Indices, getAtIndex, setAtIndex } from "./indices";
import { IndexModifier } from "./modifiers";
import { IndexSet } from "./set";
import { ChannelMap, HandlerMap } from "./utilityTypes";

/**
 * Handlers for dealing with incoming channel data mutations
 */
export type SetHandler<Type> = {
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
   * connected outgoing channels will get notified.
   *
   * Each outgoing connection maps which incoming connection corresponds to this
   * channel.
   */
  public outgoingConnections: {
    incomingConnectionIndex: number;
    channel: Automatic<any, any>;
  }[] = [];

  markDataNeedsUpdate(): void {
    for (const { incomingConnectionIndex, channel } of this
      .outgoingConnections) {
      (
        channel.setHandlers[incomingConnectionIndex] as SetHandler<Type>
      ).setData();
    }
  }

  markIndexNeedsUpdate<T extends Indices<Type>>(index: T): void {
    for (const { incomingConnectionIndex, channel } of this
      .outgoingConnections) {
      (
        channel.setHandlers[incomingConnectionIndex] as SetHandler<Type>
      ).setDataAtIndex(index);
    }
  }
}

/**
 * An automatic channel provides derived data based on connected incoming channels
 */
export abstract class Automatic<
  IncomingTypes extends any[] | [any],
  OutgoingType
> extends Channel<OutgoingType> {
  /**
   * The cached data for the channel (starts out undefined)
   */
  public cached: OutgoingType = {} as any;
  /**
   * Which indices need updating
   */
  public updateMap = new IndexSet<OutgoingType>(false);
  /**
   *
   * @param incomingChannels The list of incoming channels
   * @param setHandlers The handlers for setting data for each incoming channel.
   * These handlers should only affect the outgoing channel's cached and
   * needsUpdate properties
   * @param getHandlers The handlers for getting data from the outgoing channel.
   */
  constructor(
    readonly incomingChannels: ChannelMap<IncomingTypes>,
    readonly setHandlers: HandlerMap<IncomingTypes>,
    public getHandlers: {
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

  getData(): OutgoingType {
    const indices = this.updateMap.indices();
    if (indices == null) {
      // Update all the data
      this.getHandlers.getData();
      // Set all indices to cached
      this.updateMap.removeAll();
    } else {
      // Update indices that need updating
      for (const indexNeedingUpdate of indices) {
        this.getHandlers.getDataAtIndex(indexNeedingUpdate);
        this.updateMap.removeIndex(indexNeedingUpdate);
      }
    }
    return this.cached;
  }

  indexCached<T extends Indices<OutgoingType>>(index: T): boolean {
    if (!this.updateMap.hasIndex(index)) return true;
    return false;
  }

  getDataAtIndex<T extends Indices<OutgoingType>>(
    index: T
  ): Flatten<OutgoingType>[T] {
    if (!this.indexCached(index)) {
      this.getHandlers.getDataAtIndex(index);
      this.updateMap.removeIndex(index);
    }
    return getAtIndex(this.cached, index);
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
    this.markDataNeedsUpdate();
  }

  getData(): Type {
    return this.data;
  }

  getDataAtIndex<T extends Indices<Type>>(index: T): Flatten<Type>[T] {
    return getAtIndex(this.data, index);
  }

  setDataAtIndex<T extends Indices<Type>>(index: T, newData: Flatten<Type>[T]) {
    setAtIndex(this.data, index, newData);
    this.markIndexNeedsUpdate(index);
  }
}
