export function stringIndex(index: PropertyKey): string {
  return `${index as string}`;
}

export function indexEqual<T extends PropertyKey, U extends PropertyKey>(
  index1: T,
  index2: U
): boolean {
  return stringIndex(index1) === stringIndex(index2);
}

export function isSubIndex<T extends PropertyKey, U extends PropertyKey>(
  potentialSubIndex: T,
  parentIndex: U
): boolean {
  const subIndex = stringIndex(potentialSubIndex);
  const parent = stringIndex(parentIndex);
  return subIndex.startsWith(`${parent}.`);
}

export function getSubIndex<T extends PropertyKey, U extends PropertyKey>(
  subIndex: T,
  parentIndex: U
): PropertyKey {
  return stringIndex(subIndex).substring(stringIndex(parentIndex).length + 1);
}

export function getParentIndex<T extends PropertyKey>(
  index: T
): PropertyKey | null {
  const parts = stringIndex(index).split(".");
  if (parts.length === 0) return null;
  return parts.slice(0, -1).join(".");
}

export function areSiblings<T extends PropertyKey, U extends PropertyKey>(
  index1: T,
  index2: U
): boolean {
  const parent1 = getParentIndex(index1);
  const parent2 = getParentIndex(index2);
  return parent1 === parent2;
}

export function getLastPart<T extends PropertyKey>(
  index: T
): PropertyKey | null {
  const parts = stringIndex(index).split(".");
  if (parts.length === 0) return null;
  return parts[parts.length - 1];
}

export function lastPartAsNumber<T extends PropertyKey>(index: T): number {
  const lastPart = getLastPart(index);
  return parseInt(lastPart as string);
}

export function incrementLastPart<T extends PropertyKey>(
  index: T
): PropertyKey {
  const parts = stringIndex(index).split(".");
  parts[parts.length - 1] = `${
    parseInt(parts[parts.length - 1] as string) + 1
  }`;
  return parts.join(".");
}

export function indexJoin<T extends PropertyKey, U extends PropertyKey>(
  index1: T,
  index2: U
): PropertyKey {
  return `${stringIndex(index1)}.${stringIndex(index2)}`;
}

export function getAtIndex<Type, T extends Indices<Type>>(
  data: Type,
  index: T
): Flatten<Type>[T] {
  const parts = stringIndex(index).split(".");

  for (const part of parts) {
    data = (data as any)[part];
  }
  return data as any;
}

export function setAtIndex<Type, T extends Indices<Type>>(
  data: Type,
  index: T,
  newData: Flatten<Type>[T]
) {
  const parts = stringIndex(index).split(".");

  for (const part of parts.slice(0, -1)) {
    data = (data as any)[part];
  }
  (data as any)[parts[parts.length - 1]] = newData;
}

export function insertAtIndex<Type, T extends Indices<Type>>(
  data: Type,
  index: T,
  newData: Flatten<Type>[T]
) {
  const parts = stringIndex(index).split(".");

  for (const part of parts.slice(0, -1)) {
    data = (data as any)[part];
  }
  (data as any).splice(parts[parts.length - 1], 0, newData);
}

export type Indices<T> = keyof Flatten<T>;

export type Flatten<T, O = never> = Writable<Cleanup<T>, O> extends infer U
  ? U extends O
    ? U
    : U extends object
    ?
        | ValueOf<{
            [K in keyof U]-?: (x: PrefixKeys<Flatten<U[K], O>, K, O>) => void;
          }>
        | ((x: U) => void) extends (x: infer I) => void
      ? { [K in keyof I]: I[K] }
      : never
    : U
  : never;

type Writable<T, O> = T extends O
  ? T
  : {
      [P in keyof T as IfEquals<
        { [Q in P]: T[P] },
        { -readonly [Q in P]: T[P] },
        P
      >]: T[P];
    };

type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? A
  : B;

type Cleanup<T> = 0 extends 1 & T
  ? unknown
  : T extends readonly any[]
  ? Exclude<keyof T, keyof any[]> extends never
    ? { [k: `${number}`]: T[number] }
    : Omit<T, keyof any[]>
  : T;

type PrefixKeys<V, K extends PropertyKey, O> = V extends O
  ? { [P in K]: V }
  : V extends object
  ? {
      [P in keyof V as `${Extract<K, string | number>}.${Extract<
        P,
        string | number
      >}`]: V[P];
    }
  : { [P in K]: V };

type ValueOf<T> = T[keyof T];
