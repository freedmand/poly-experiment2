// deno-lint-ignore-file no-explicit-any
import { Flatten, Indices } from "./flattenKeys.ts";
import { IndexModifier } from "./modifiers.ts";

/**
 * The connection class maps input and output channels
 *
 * TODO:
 *  - set new data of only certain types and indices
 *  -
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
    readonly setDataHandler: (
      this: Connection<IncomingType, OutgoingType>,
      newData: IncomingType
    ) => void,
    readonly setDataAtIndexHandler: <T extends keyof Flatten<IncomingType>>(
      this: Connection<IncomingType, OutgoingType>,
      index: T,
      newData: Flatten<IncomingType>[T]
    ) => void,
    readonly modifyIndicesHandler: (
      this: Connection<IncomingType, OutgoingType>,
      indexModifier: IndexModifier
    ) => void
  ) {
    this.setDataHandler = setDataHandler.bind(this);
    this.setDataAtIndexHandler = setDataAtIndexHandler.bind(this);
    this.modifyIndicesHandler = modifyIndicesHandler.bind(this);
  }
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
  constructor(readonly connections: Connection<any, Type>[]) {}

  abstract getData(): Type;

  abstract getDataAtIndex<T extends Indices<Type>>(index: T): Flatten<Type>[T];
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

  getDataAtIndex<T extends keyof Flatten<Type>>(index: T): Flatten<Type>[T] {
    const parts = (index as string).split(".");

    let data = this.data;
    for (const part of parts) {
      data = (data as any)[part];
    }
    return data as any;
  }

  setDataAtIndex<T extends keyof Flatten<Type>>(
    index: T,
    newData: Flatten<Type>[T]
  ) {
    const parts = (index as string).split(".");

    let data = this.data;
    for (const part of parts.slice(0, -1)) {
      data = (data as any)[part];
    }
    (data as any)[parts[parts.length - 1]] = newData;
  }
}
