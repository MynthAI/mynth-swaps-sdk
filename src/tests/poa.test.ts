import { Transaction } from "@dcspark/cardano-multiplatform-lib-nodejs";
import test from "ava";
import PowerOfAttorney from "builder/power-of-attorney";
import { Builder, loadLucid } from "mynth-swaps-sdk";
import { address, tokens } from "./wallet";

test("can take control of order via POA", async (t) => {
  const lucid = (await loadLucid(address)).assert();
  const builder = (await Builder.create(lucid)).assert();
  const poa = (await PowerOfAttorney.create(lucid)).assert();

  (
    await builder.limit(100, tokens.one, tokens.two, 1.5, poa.extension)
  ).assert();
  (await builder.complete()).assert();

  const swap = builder.getReferences()[0];
  (await builder.run(poa.build(swap))).assert();
  const cbor = (await builder.complete()).assert().toCBOR();
  const transaction = Transaction.from_cbor_hex(cbor);
  t.true(transaction.is_valid());
});
