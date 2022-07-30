import {
  Flatten,
  Indices,
  getAtIndex,
  setAtIndex,
  insertAtIndex,
  indexEqual,
  isSubIndex,
  getSubIndex,
  indexJoin,
  areSiblings,
  lastPartAsNumber,
  incrementLastPart,
} from "./indices";
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
  readonly modifyIndicesHandler: <U extends Indices<Type>>(
    indexModifier: IndexModifier<U>
  ) => void;
};

export interface Listener<IncomingTypes extends any[] | [any]> {
  setHandlers: HandlerMap<IncomingTypes>;
}

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
   * Gets the data element at the specified index as a downstream channel
   * @param index The index of data to retrieve
   */
  getChannelAtIndex<T extends Indices<Type>>(
    index: T
  ): Automatic<[Type], Flatten<Type>[T]> {
    return new IndexAccess(this, index);
  }

  /**
   * A list of outgoing connections for the channel. When data is updated,
   * connected outgoing channels will get notified.
   *
   * Each outgoing connection maps which incoming connection corresponds to this
   * channel.
   */
  public outgoingConnections: {
    incomingConnectionIndex: number;
    listener: Listener<any>;
  }[] = [];

  markDataNeedsUpdate(): void {
    for (const { incomingConnectionIndex, listener } of this
      .outgoingConnections) {
      (
        listener.setHandlers[incomingConnectionIndex] as SetHandler<Type>
      ).setData();
    }
  }

  markIndexNeedsUpdate<T extends Indices<Type>>(index: T): void {
    for (const { incomingConnectionIndex, listener } of this
      .outgoingConnections) {
      (
        listener.setHandlers[incomingConnectionIndex] as SetHandler<Type>
      ).setDataAtIndex(index);
    }
  }

  markModification<T extends Indices<Type>>(modifier: IndexModifier<T>): void {
    for (const { incomingConnectionIndex, listener } of this
      .outgoingConnections) {
      (
        listener.setHandlers[incomingConnectionIndex] as SetHandler<Type>
      ).modifyIndicesHandler(modifier);
    }
  }
}

/**
 * An automatic channel provides derived data based on connected incoming channels
 */
export class Automatic<
  IncomingTypes extends any[] | [any],
  OutgoingType
> extends Channel<OutgoingType> {
  /**
   * The cached data for the channel (starting value defined by subclass)
   */
  cached: OutgoingType = undefined!;
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
        listener: this,
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

  setDataAtIndex<T extends Indices<Type>>(index: T, newData: Flatten<Type>[T]) {
    setAtIndex(this.data, index, newData);
    this.markIndexNeedsUpdate(index);
  }

  getDataAtIndex<T extends Indices<Type>>(index: T): Flatten<Type>[T] {
    return getAtIndex(this.data, index);
  }

  insert<T extends Indices<Type>>(index: T, newData: Flatten<Type>[T]) {
    insertAtIndex(this.data, index, newData);
    this.markModification({
      type: "InsertModifier",
      index,
    });
  }
}

export class IndexAccess<
  InputType,
  Index extends Indices<InputType>
> extends Automatic<[InputType], Flatten<InputType>[Index]> {
  constructor(public incoming: Channel<InputType>, public index: Index) {
    super(
      [incoming],
      [
        {
          setData: () => {
            this.updateMap.addAll();
            this.markDataNeedsUpdate();
          },
          setDataAtIndex: (index: Indices<InputType>) => {
            // Only do something if the index is a part of the watched index
            if (indexEqual(index, this.index)) {
              // Equivalent to setting all data
              this.updateMap.addAll();
              this.markDataNeedsUpdate();
            } else if (isSubIndex(index, this.index)) {
              // Actually set at index
              const subIndex = getSubIndex(index, this.index) as Indices<
                Flatten<InputType>[Index]
              >;
              this.updateMap.addIndex(subIndex);
              this.markIndexNeedsUpdate(subIndex);
            }
          },
          modifyIndicesHandler: (
            modifier: IndexModifier<Indices<InputType>>
          ) => {
            switch (modifier.type) {
              case "InsertModifier":
                if (isSubIndex(modifier.index, this.index)) {
                  // React to index modification
                  const subIndex = getSubIndex(index, this.index) as Indices<
                    Flatten<InputType>[Index]
                  >;
                  this.markModification({
                    type: "InsertModifier",
                    index: subIndex,
                  });
                } else if (areSiblings(modifier.index, this.index)) {
                  // Potentially adjust index
                  const modifierIndex = lastPartAsNumber(modifier.index);
                  const thisIndex = lastPartAsNumber(this.index);
                  if (modifierIndex <= thisIndex) {
                    // Adjust the index in response to modification
                    this.index = incrementLastPart(this.index) as Index;
                  }
                }
            }
          },
        },
      ],
      {
        getData: () => {
          this.cached = getAtIndex(this.incoming.getData(), this.index);
        },
        getDataAtIndex: (index: Indices<Flatten<InputType>[Index]>) => {
          setAtIndex(
            this.cached,
            index,
            this.incoming.getDataAtIndex(
              indexJoin(this.index, index) as Index
            ) as any
          );
        },
      }
    );
  }
}

export class ListenerChannel<T> implements Listener<[T]> {
  constructor(
    public incoming: Channel<T>,
    public dataCallback: (data: T) => void,
    public dataIndexCallback: <U extends Indices<T>>(
      index: U,
      value: Flatten<T>[U]
    ) => void,
    public modifyIndicesCallback: (modifier: IndexModifier<Indices<T>>) => void
  ) {
    this.incoming.outgoingConnections.push({
      incomingConnectionIndex: this.incoming.outgoingConnections.length,
      listener: this,
    });
  }

  public setHandlers: [SetHandler<T>] = [
    {
      setData: () => {
        this.dataCallback(this.incoming.getData());
      },
      setDataAtIndex: (index: Indices<T>) => {
        this.dataIndexCallback(index, this.incoming.getDataAtIndex(index));
      },
      modifyIndicesHandler: (modifier: IndexModifier<Indices<T>>) => {
        this.modifyIndicesCallback(modifier);
      },
    },
  ];
}
