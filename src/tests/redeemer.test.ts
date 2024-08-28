import { Data } from "@lucid-evolution/lucid";
import { type } from "arktype";
import test from "ava";
import { Swap } from "mynth-swaps-sdk";

test("swap redeemer is valid", (t) => {
  type({ index: "3", fields: [] }).assert(Data.from(Swap));
  t.pass();
});
