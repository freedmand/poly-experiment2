import { IndexSet } from "./set";

test("basic set", () => {
  // A new set should have nothing in it
  const s = new IndexSet();
  expect(s.hasIndex("1")).toEqual(false);
  expect(s.indices()).toEqual([]);
  expect(s.nonIndices()).toEqual(null);

  // Add index 1 to the set
  s.addIndex("1");
  expect(s.hasIndex("1")).toEqual(true);
  expect(s.indices()).toEqual(["1"]);
  expect(s.nonIndices()).toEqual(null);

  // Remove index 1 from the set
  s.removeIndex("1");
  expect(s.hasIndex("1")).toEqual(false);
  expect(s.indices()).toEqual([]);
  expect(s.nonIndices()).toEqual(null);
});

test("add all", () => {
  const s = new IndexSet();
  s.addAll();
  expect(s.hasIndex("1")).toEqual(true);
  expect(s.indices()).toEqual(null);
  expect(s.nonIndices()).toEqual([]);

  s.removeIndex("1");
  expect(s.hasIndex("1")).toEqual(false);
  expect(s.indices()).toEqual(null);
  expect(s.nonIndices()).toEqual(["1"]);
});

test("add then remove all", () => {
  const s = new IndexSet();
  s.addIndex("1");
  expect(s.hasIndex("1")).toEqual(true);
  expect(s.indices()).toEqual(["1"]);
  expect(s.nonIndices()).toEqual(null);

  s.removeIndex("2");
  expect(s.hasIndex("2")).toEqual(false);
  expect(s.indices()).toEqual(["1"]);
  expect(s.nonIndices()).toEqual(null);
  s.addIndex("2");
  expect(s.hasIndex("2")).toEqual(true);
  expect(s.indices()).toEqual(["1", "2"]);
  expect(s.nonIndices()).toEqual(null);

  s.removeAll();
  expect(s.hasIndex("1")).toEqual(false);
  expect(s.hasIndex("2")).toEqual(false);
  expect(s.indices()).toEqual([]);
  expect(s.nonIndices()).toEqual(null);

  s.addIndex("2");
  expect(s.hasIndex("2")).toEqual(true);
  expect(s.indices()).toEqual(["2"]);
  expect(s.nonIndices()).toEqual(null);
});

test("remove and add", () => {
  const s = new IndexSet();
  s.addAll();
  s.removeIndex("1");
  expect(s.hasIndex("1")).toEqual(false);
  expect(s.hasIndex("2")).toEqual(true);
  expect(s.indices()).toEqual(null);
  expect(s.nonIndices()).toEqual(["1"]);

  s.addIndex("1");
  expect(s.hasIndex("1")).toEqual(true);
  expect(s.hasIndex("2")).toEqual(true);
  expect(s.indices()).toEqual(null);
  expect(s.nonIndices()).toEqual([]);
});
