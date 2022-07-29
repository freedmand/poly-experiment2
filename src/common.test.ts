import { Data } from "./channel";
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
