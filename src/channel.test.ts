import { Data } from "./channel";

test("array", () => {
  const data = new Data([1, 2, 3]);
  data.setDataAtIndex("0", 4);

  expect(data.data).toEqual([4, 2, 3]);
});

test("tuple", () => {
  const data = new Data<[number, string, number]>([1, "dog", 3]);
  data.setDataAtIndex("0", 4);

  expect(data.data).toEqual([4, "dog", 3]);

  data.setDataAtIndex("1", "cat");

  expect(data.data).toEqual([4, "cat", 3]);
});

test("dict", () => {
  const data = new Data({ status: "ok", code: 200 });
  data.setDataAtIndex("status", "error");

  expect(data.data).toEqual({ status: "error", code: 200 });

  data.setDataAtIndex("code", 404);

  expect(data.data).toEqual({ status: "error", code: 404 });
});

test("nested dict", () => {
  const data = new Data({
    response: {
      status: "ok",
      code: 200,
    },
  });

  data.setDataAtIndex("response.status", "goodbye");

  expect(data.data).toEqual({
    response: {
      status: "goodbye",
      code: 200,
    },
  });
});

test("deeply nested dict", () => {
  const data = new Data({
    message: {
      response: {
        status: "ok",
        codes: [200, "success"] as [number, string],
      },
    },
    body: "",
  });

  data.setDataAtIndex("message.response.codes", [404, "notfound"]);

  expect(data.data).toEqual({
    message: {
      response: {
        status: "ok",
        codes: [404, "notfound"],
      },
    },
    body: "",
  });

  data.setDataAtIndex("message.response.codes.0", 403);
  data.setDataAtIndex("message.response.codes.1", "unauthorized");
  data.setDataAtIndex("message.response.status", "error");
  data.setDataAtIndex("body", "<p>access denied.</p>");

  expect(data.data).toEqual({
    message: {
      response: {
        status: "error",
        codes: [403, "unauthorized"],
      },
    },
    body: "<p>access denied.</p>",
  });
});

test("whole value replacement", () => {
  const data = new Data({ body: "hello" });

  data.setData({ body: "dog" });

  expect(data.getData()).toEqual({ body: "dog" });
});
