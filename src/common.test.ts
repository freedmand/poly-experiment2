import { Data, ListenerChannel } from "./channel";
import { Map } from "./common";
import { getDataCalls } from "./testing";

test("map", () => {
  // Create a simple list
  const data = new Data([1, 2, 3]);
  // Create a derived mapped list
  const mapData = new Map(data, (x) => `(${x * 2})`);
  const mapDataCalls = getDataCalls(mapData);
  // No data calls yet
  expect(mapDataCalls()).toEqual([0, {}]);

  // Getting all the data
  expect(mapData.getData()).toEqual(["(2)", "(4)", "(6)"]);
  expect(mapDataCalls()).toEqual([1, {}]);

  // Getting the data at an index doesn't result in an additional call
  expect(mapData.getDataAtIndex("2")).toEqual("(6)");
  expect(mapDataCalls()).toEqual([1, {}]);
  // Setting data at an index doesn't result in an additional call
  data.setDataAtIndex("2", 5);
  expect(mapDataCalls()).toEqual([1, {}]);
  // Only when retrieving the data does it count
  expect(mapData.getDataAtIndex("2")).toEqual("(10)");
  expect(mapDataCalls()).toEqual([1, { "2": 1 }]);
  // Getting all the data again doesn't result in any additional calls
  expect(mapData.getData()).toEqual(["(2)", "(4)", "(10)"]);
  expect(mapDataCalls()).toEqual([1, { "2": 1 }]);
});

test("map no cache", () => {
  // Create a simple list
  const data = new Data([1, 2, 3]);
  // Create a derived mapped list
  const mapData = new Map(data, (x) => `(${x * 2})`);
  const mapDataCalls = getDataCalls(mapData);

  // Get just the data at a specific index
  expect(mapData.getDataAtIndex("0")).toEqual("(2)");
  expect(mapDataCalls()).toEqual([0, { 0: 1 }]);

  // Getting the data again should not result in any additional calls
  expect(mapData.getDataAtIndex("0")).toEqual("(2)");
  expect(mapDataCalls()).toEqual([0, { 0: 1 }]);

  // Getting the data at index 2 will
  expect(mapData.getDataAtIndex("2")).toEqual("(6)");
  expect(mapDataCalls()).toEqual([0, { 0: 1, 2: 1 }]);

  // Getting all the data will result in a full data get call
  expect(mapData.getData()).toEqual(["(2)", "(4)", "(6)"]);
  expect(mapDataCalls()).toEqual([1, { 0: 1, 2: 1 }]);
});

test("map get index after full", () => {
  // Create a simple list
  const data = new Data([1, 2, 3]);
  // Create a derived mapped list and get all data
  const mapData = new Map(data, (x) => `(${x * 2})`);
  const mapDataCalls = getDataCalls(mapData);
  mapData.getData();
  expect(mapDataCalls()).toEqual([1, {}]);

  // Get an index, which shouldn't result in any additional calls
  expect(mapData.getDataAtIndex("2")).toEqual(`(6)`);
  expect(mapDataCalls()).toEqual([1, {}]);
});

test("deep map set index", () => {
  // Set up a deep map
  const data = new Data([1, 2, 3]);
  const timesTwo = new Map(data, (x) => x * 2);
  const timesTwoCalls = getDataCalls(timesTwo);
  const plus5 = new Map(timesTwo, (x) => x + 5);
  const plus5Calls = getDataCalls(plus5);

  // Expect all the calls to be empty
  expect(timesTwoCalls()).toEqual([0, {}]);
  expect(plus5Calls()).toEqual([0, {}]);

  // Get the data, resulting in 1 getData call for each
  expect(plus5.getData()).toEqual([7, 9, 11]);
  expect(timesTwoCalls()).toEqual([1, {}]);
  expect(plus5Calls()).toEqual([1, {}]);

  // Set the base data at an index
  data.setDataAtIndex("2", 5);
  expect(plus5.getDataAtIndex("2")).toEqual(15);
  expect(timesTwoCalls()).toEqual([1, { "2": 1 }]);
  expect(plus5Calls()).toEqual([1, { "2": 1 }]);

  // Get data shouldn't result in any additional calls for either
  expect(timesTwoCalls()).toEqual([1, { "2": 1 }]);
  expect(plus5Calls()).toEqual([1, { "2": 1 }]);
});

test("deep map set full", () => {
  // Set up a deep map, don't access it
  const data = new Data([1, 2, 3]);
  const timesTwo = new Map(data, (x) => x * 2);
  const timesTwoCalls = getDataCalls(timesTwo);
  const plus5 = new Map(timesTwo, (x) => x + 5);
  const plus5Calls = getDataCalls(plus5);
  expect(timesTwoCalls()).toEqual([0, {}]);
  expect(plus5Calls()).toEqual([0, {}]);

  // Set the data, then access it
  data.setData([5, 10]);
  expect(timesTwoCalls()).toEqual([0, {}]);
  expect(plus5Calls()).toEqual([0, {}]);
  expect(plus5.getData()).toEqual([15, 25]);
  expect(timesTwoCalls()).toEqual([1, {}]);
  expect(plus5Calls()).toEqual([1, {}]);
});

test("map with index shift", () => {
  // Insert something at the beginning of a list
  const data = new Data([1, 2, 3]);
  const timesTwo = new Map(data, (x) => x * 2);
  const timesTwoCalls = getDataCalls(timesTwo);
  data.insert("0", 5);
  expect(timesTwoCalls()).toEqual([0, {}]);

  // Get data works
  expect(data.getData()).toEqual([5, 1, 2, 3]);
  expect(timesTwo.getData()).toEqual([10, 2, 4, 6]);
  expect(timesTwoCalls()).toEqual([1, {}]);
});

test("map with index shift get index", () => {
  // Insert something at the beginning of a list
  const data = new Data([1, 2, 3]);
  const timesTwo = new Map(data, (x) => x * 2);
  const timesTwoCalls = getDataCalls(timesTwo);
  data.insert("0", 5);
  expect(timesTwoCalls()).toEqual([0, {}]);

  // Getting at specific indices works
  expect(timesTwo.getDataAtIndex("1")).toEqual(2);
  expect(timesTwoCalls()).toEqual([0, { "1": 1 }]);
  expect(timesTwo.getDataAtIndex("0")).toEqual(10);
  expect(timesTwoCalls()).toEqual([0, { "0": 1, "1": 1 }]);
  expect(timesTwo.getData()).toEqual([10, 2, 4, 6]);
  expect(timesTwoCalls()).toEqual([1, { "0": 1, "1": 1 }]);
});

test("map with index shift in middle get index", () => {
  // Insert something in the middle of a list
  const data = new Data([1, 2, 3]);
  const timesTwo = new Map(data, (x) => x * 2);
  const timesTwoCalls = getDataCalls(timesTwo);
  data.insert("2", 5);
  expect(timesTwoCalls()).toEqual([0, {}]);

  // Getting at specific indices works
  expect(timesTwo.getDataAtIndex("1")).toEqual(4);
  expect(timesTwoCalls()).toEqual([0, { "1": 1 }]);
  expect(timesTwo.getDataAtIndex("2")).toEqual(10);
  expect(timesTwoCalls()).toEqual([0, { "1": 1, "2": 1 }]);
  expect(timesTwo.getData()).toEqual([2, 4, 10, 6]);
  expect(timesTwoCalls()).toEqual([1, { "1": 1, "2": 1 }]);
});

test("map with index shift empty list", () => {
  // Insert something in an empty list
  const data = new Data([] as number[]);
  const timesTwo = new Map(data, (x) => x * 2);
  const timesTwoCalls = getDataCalls(timesTwo);
  data.insert("0", 5);
  expect(timesTwoCalls()).toEqual([0, {}]);

  // Getting at specific indices works
  expect(timesTwo.getDataAtIndex("0")).toEqual(10);
  expect(timesTwoCalls()).toEqual([0, { "0": 1 }]);
  expect(timesTwo.getData()).toEqual([10]);
  expect(timesTwoCalls()).toEqual([1, { "0": 1 }]);
});

test("map with index shift empty list get all data", () => {
  // Insert something in an empty list
  const data = new Data([] as number[]);
  const timesTwo = new Map(data, (x) => x * 2);
  const timesTwoCalls = getDataCalls(timesTwo);
  data.insert("0", 5);
  expect(timesTwoCalls()).toEqual([0, {}]);

  // Getting at specific indices works
  expect(timesTwo.getData()).toEqual([10]);
  expect(timesTwoCalls()).toEqual([1, {}]);
});

test("map of nested data", () => {
  // Create a pizza
  const data = new Data({
    pizzaSize: "L",
    toppings: ["peppers", "onions"],
  });

  // Create an auto channel of the toppings surrounded by parens
  const toppingsInParens = new Map(
    data.getChannelAtIndex("toppings"),
    (x) => `(${x})`
  );
  const toppingsInParensCalls = getDataCalls(toppingsInParens);
  expect(toppingsInParensCalls()).toEqual([0, {}]);

  // Get the data
  expect(toppingsInParens.getData()).toEqual(["(peppers)", "(onions)"]);
  expect(toppingsInParensCalls()).toEqual([1, {}]);

  // Change one of the toppings
  data.setDataAtIndex("toppings.0", "cilantro");
  expect(toppingsInParens.getDataAtIndex("0")).toEqual("(cilantro)");
  expect(toppingsInParensCalls()).toEqual([1, { "0": 1 }]);

  // Get all data again
  expect(toppingsInParens.getData()).toEqual(["(cilantro)", "(onions)"]);
  expect(toppingsInParensCalls()).toEqual([1, { "0": 1 }]);
});

test("map of nested data doesn't react to irrelevant updates", () => {
  // Create a pizza
  const data = new Data({
    pizzaSize: "L",
    toppings: ["peppers", "onions"],
  });

  // Create an auto channel of the toppings surrounded by parens
  const toppingsInParens = new Map(
    data.getChannelAtIndex("toppings"),
    (x) => `(${x})`
  );
  const toppingsInParensCalls = getDataCalls(toppingsInParens);
  expect(toppingsInParensCalls()).toEqual([0, {}]);

  // Change the pizza size and get the toppings (should have no effect)
  data.setDataAtIndex("pizzaSize", "M");
  expect(toppingsInParens.getData()).toEqual(["(peppers)", "(onions)"]);
  expect(toppingsInParensCalls()).toEqual([1, {}]);

  // Change the pizza size again. Toppings should still be cached
  data.setDataAtIndex("pizzaSize", "S");
  expect(toppingsInParens.getData()).toEqual(["(peppers)", "(onions)"]);
  expect(toppingsInParensCalls()).toEqual([1, {}]);
});

test("map of nested data with insert", () => {
  // Create a pizza
  const data = new Data({
    pizzaSize: "L",
    toppings: ["peppers", "onions"],
  });

  // Create an auto channel of the toppings surrounded by parens
  const toppingsInParens = new Map(
    data.getChannelAtIndex("toppings"),
    (x) => `(${x})`
  );
  const toppingsInParensCalls = getDataCalls(toppingsInParens);
  expect(toppingsInParensCalls()).toEqual([0, {}]);

  // Change the pizza size and get the toppings (should have no effect)
  data.insert("toppings.2", "garlic");
  expect(toppingsInParens.getData()).toEqual([
    "(peppers)",
    "(onions)",
    "(garlic)",
  ]);
  expect(toppingsInParensCalls()).toEqual([1, {}]);
});

test("map of nested array with insert", () => {
  // Create a matrix
  const data = new Data([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ] as { [key: number]: number[] }); // TODO: figure out how to preserve number[][]

  // Create an auto channel of the middle row
  const middleRow = data.getChannelAtIndex(1);
  const middleRowCalls = getDataCalls(middleRow);
  expect(middleRowCalls()).toEqual([0, {}]);

  // Get the data
  expect(middleRow.getData()).toEqual([4, 5, 6]);
  expect(middleRowCalls()).toEqual([1, {}]);

  // Insert in the middle row (no more calls needed to get data)
  data.insert("1.0", 0);
  expect(middleRowCalls()).toEqual([1, {}]);
  expect(middleRow.getDataAtIndex("1")).toEqual(4);
  expect(middleRowCalls()).toEqual([1, {}]);
  expect(middleRow.getDataAtIndex("0")).toEqual(0);
  expect(middleRowCalls()).toEqual([1, {}]);
  expect(middleRow.getData()).toEqual([0, 4, 5, 6]);
  expect(middleRowCalls()).toEqual([1, {}]);

  // Insert top-level data
  data.insert(0, [9]);
  data.insert(4, [10]);
  expect(data.getData()).toEqual([
    [9],
    [1, 2, 3],
    [0, 4, 5, 6],
    [7, 8, 9],
    [10],
  ]);

  // Set the middle row (which has now shifted)
  data.setDataAtIndex(2, [0, 11]);
  expect(middleRowCalls()).toEqual([1, {}]);
  expect(middleRow.getDataAtIndex("1")).toEqual(11);
  expect(middleRowCalls()).toEqual([1, { "1": 1 }]);
  expect(middleRow.getData()).toEqual([0, 11]);
  expect(middleRowCalls()).toEqual([2, { "1": 1 }]);
});

test("listener channel", () => {
  // Create basic array data
  const data = new Data([1, 2, 3]);

  // Mock callbacks for every aspect of modification
  const dataCallback = jest.fn();
  const dataIndexCallback = jest.fn();
  const modifyIndicesCallback = jest.fn();

  // Create a listener that links with the mocks
  new ListenerChannel(
    data,
    dataCallback,
    dataIndexCallback,
    modifyIndicesCallback
  );

  // Mocks should be empty
  expect(dataCallback.mock.calls.length).toEqual(0);
  expect(dataIndexCallback.mock.calls.length).toEqual(0);
  expect(modifyIndicesCallback.mock.calls.length).toEqual(0);

  // Set all the data
  data.setData([9, 10]);

  // Data callback should have been triggered (and no others)
  expect(dataCallback.mock.calls).toEqual([[[9, 10]]]);
  expect(dataIndexCallback.mock.calls.length).toEqual(0);
  expect(modifyIndicesCallback.mock.calls.length).toEqual(0);

  // Set the data at an index
  data.setDataAtIndex("1", 8);

  // Data index callback should have been triggered (and no others)
  expect(dataCallback.mock.calls.length).toEqual(1);
  expect(dataIndexCallback.mock.calls).toEqual([["1", 8]]);
  expect(modifyIndicesCallback.mock.calls.length).toEqual(0);

  // Insert on the data
  data.insert("1", 8.5);

  // Index modification callback should have been triggered (and no others)
  expect(dataCallback.mock.calls.length).toEqual(1);
  expect(dataIndexCallback.mock.calls.length).toEqual(1);
  expect(modifyIndicesCallback.mock.calls).toEqual([
    [
      {
        type: "InsertModifier",
        index: "1",
      },
    ],
  ]);
});
