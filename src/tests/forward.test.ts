import { Transaction } from "@anastasia-labs/cardano-multiplatform-lib-nodejs";
import test from "ava";
import { Builder, Forwarder, loadLucid } from "mynth-swaps-sdk";
import { address, tokens } from "./wallet";

test("can forward an order after filling", async (t) => {
  const lucid = (await loadLucid(address)).assert();
  const builder = (await Builder.create(lucid)).assert();
  const forwarder = (await Forwarder.create(lucid)).assert();

  // Create order
  (
    await builder.limit(100, tokens.one, tokens.two, 1.5, forwarder.extension)
  ).assert();
  (await builder.complete()).assert();

  // Fill swap
  let swap = builder.getReferences()[0];
  (await builder.fill(swap)).assert();
  (await builder.complete()).assert();

  // Forward token back to owner
  swap = builder.getReferences()[0];
  (await builder.run(forwarder.build(swap))).assert();
  const cbor = (await builder.complete()).assert().toCBOR();
  const transaction = Transaction.from_cbor_hex(cbor);
  t.true(transaction.is_valid());
});
