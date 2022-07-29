import { Indices } from "./indices";

export function getDataCalls<
  U,
  T extends {
    getHandlers: {
      getData: () => void;
      getDataAtIndex: (index: Indices<U>) => void;
    };
  }
>(
  automatic: T
): () => [
  number,
  {
    [key in Indices<U>]: number;
  }
] {
  const getDataMock = jest.spyOn(automatic.getHandlers, "getData");
  const getDataAtIndexMock = jest.spyOn(
    automatic.getHandlers,
    "getDataAtIndex"
  );

  const reduce = (
    calls: [Indices<U>][]
  ): {
    [key in Indices<U>]: number;
  } => {
    const results: {
      [key in Indices<U>]: number;
    } = {} as {
      [key in Indices<U>]: number;
    };
    for (const [call] of calls) {
      results[call] = (results[call] || 0) + 1;
    }
    return results;
  };

  return () => [
    getDataMock.mock.calls.length,
    reduce(getDataAtIndexMock.mock.calls),
  ];
}
