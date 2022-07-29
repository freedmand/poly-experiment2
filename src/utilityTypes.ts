import { Channel, SetHandler } from "./channel";

export type EnforceArray<T> = T extends any[] ? T : never;
export type ChannelMap<T extends any[] | [any]> = EnforceArray<{
  [K in keyof T]: Channel<T[K]>;
}>;
export type HandlerMap<T extends any[] | [any]> = EnforceArray<{
  [K in keyof T]: SetHandler<T[K]>;
}>;
