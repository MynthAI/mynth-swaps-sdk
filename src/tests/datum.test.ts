import { Data } from "@lucid-evolution/lucid";
import { type } from "arktype";
import test from "ava";
import { from, OneWaySwapDatum } from "mynth-swaps-sdk";

test("OneWaySwapDatum is valid", (t) => {
  const datum = OneWaySwapDatum("", "", "", "", "", [1, 2], 0).assert();
  type({ index: "0", fields: type("string|bigint|object").array() }).assert(
    Data.from(datum)
  );
  t.pass();
});

test("can parse OneWaySwapDatum", (t) => {
  from
    .oneWaySwap(OneWaySwapDatum("", "", "", "", "", [1, 2], 0).assert())
    .assert();
  t.pass();
});
