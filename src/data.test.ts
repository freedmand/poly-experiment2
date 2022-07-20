import { assertEquals } from "https://deno.land/std@0.147.0/testing/asserts.ts";
import { Data } from "./data.ts";

Deno.test("array", () => {
  const data = new Data([1, 2, 3]);
  data.setDataAtIndex("0", 4);

  assertEquals(data.data, [4, 2, 3]);
});

Deno.test("tuple", () => {
  const data = new Data<[number, string, number]>([1, "dog", 3]);
  data.setDataAtIndex("0", 4);

  assertEquals(data.data, [4, "dog", 3]);

  data.setDataAtIndex("1", "cat");

  assertEquals(data.data, [4, "cat", 3]);
});

Deno.test("dict", () => {
  const data = new Data({ status: "ok", code: 200 });
  data.setDataAtIndex("status", "error");

  assertEquals(data.data, { status: "error", code: 200 });

  data.setDataAtIndex("code", 404);

  assertEquals(data.data, { status: "error", code: 404 });
});

Deno.test("nested dict", () => {
  const data = new Data({
    response: {
      status: "ok",
      code: 200,
    },
  });

  data.setDataAtIndex("response.status", "goodbye");

  assertEquals(data.data, {
    response: {
      status: "goodbye",
      code: 200,
    },
  });
});

Deno.test("deeply nested dict", () => {
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

  assertEquals(data.data, {
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

  assertEquals(data.data, {
    message: {
      response: {
        status: "error",
        codes: [403, "unauthorized"],
      },
    },
    body: "<p>access denied.</p>",
  });
});

Deno.test("whole value replacement", () => {
  const data = new Data({ body: "hello" });

  data.setData({ body: "dog" });

  assertEquals(data.getData(), { body: "dog" });
});
