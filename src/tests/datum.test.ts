import { Data } from "@lucid-evolution/lucid";
import { type } from "arktype";
import test from "ava";
import { OneWaySwapDatum } from "mynth-swaps-sdk";

test("OneWaySwapDatum is valid", (t) => {
  const datum = OneWaySwapDatum("", "", "", "", "", [1, 2]).assert();
  type({ index: "0", fields: type("string|bigint|object").array() }).assert(
    Data.from(datum)
  );
  t.pass();
});
