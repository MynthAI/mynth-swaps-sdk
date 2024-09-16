import { Transaction } from "@anastasia-labs/cardano-multiplatform-lib-nodejs";
import test from "ava";
import { Builder, loadLucid } from "mynth-swaps-sdk";
import { address, tokens } from "./wallet";

test("can cancel limit order", async (t) => {
  const lucid = (await loadLucid(address)).assert();
  const builder = (await Builder.create(lucid)).assert();

  (await builder.limit(100, tokens.one, tokens.two, 1.5)).assert();
  (await builder.complete()).assert();

  const swap = builder.getReferences()[0];
  (await builder.cancel(swap)).assert();
  const cbor = (await builder.complete()).assert().toCBOR();
  const transaction = Transaction.from_cbor_hex(cbor);
  t.true(transaction.is_valid());
});

test("can cancel multiple limit orders", async (t) => {
  const lucid = (await loadLucid(address)).assert();
  const builder = (await Builder.create(lucid)).assert();

  (await builder.limit(100, tokens.one, tokens.two, 1.5)).assert();
  (await builder.limit(100, tokens.one, tokens.two, 1.3)).assert();
  (await builder.complete()).assert();

  const [swap1, swap2] = builder.getReferences();
  (await builder.cancel(swap1)).assert();
  (await builder.cancel(swap2)).assert();
  const cbor = (await builder.complete()).assert().toCBOR();
  const transaction = Transaction.from_cbor_hex(cbor);
  t.true(transaction.is_valid());
});
