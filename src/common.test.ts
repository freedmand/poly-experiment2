import { Data } from "./channel";
import { Map } from "./common";

test("map", () => {
  const data = new Data([1, 2, 3]);
  const mapData = new Map(data, (x) => `(${x * 2})`);

  expect(mapData.getData()).toEqual(["(2)", "(4)", "(6)"]);

  data.setDataAtIndex("2", 5);
  expect(mapData.getDataAtIndex("2")).toEqual("(10)");
  expect(mapData.getData()).toEqual(["(2)", "(4)", "(10)"]);
});
