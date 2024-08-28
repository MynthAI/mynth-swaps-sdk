import { Transaction } from "@dcspark/cardano-multiplatform-lib-nodejs";
import test from "ava";
import { Builder, loadLucid } from "mynth-swaps-sdk";

const address =
  "addr_test1qp7t9649xy7fgpsrvz9zsm78m8msqkpme4a37pwdl7x7y3lehhunauqjse0xxq4qxmgyeyk8rnrxpnkf5g4276wcgnsqvyj7gw";
const tokens = {
  one: "d613d5f475789343a04c0e68176b8bc24e8174031184e0f85aebb95c4d5954455354544f4b454e31",
  two: "f570970bf8ef2e47033bae45ee53bb34a7b157e60adbf833a4302d224d5954455354544f4b454e32",
};

test("can create limit order", async (t) => {
  const lucid = (await loadLucid(address)).assert();
  const builder = (await Builder.create(lucid)).assert();

  const tx = (await builder.limit(100, tokens.one, tokens.two, 1.5)).assert();
  const cbor = (await tx.complete()).assert().toCBOR();
  const transaction = Transaction.from_cbor_hex(cbor);
  t.true(transaction.is_valid());
  t.is(transaction.body().mint()?.policy_count(), 1);
  t.is(transaction.body().outputs().len(), 2);
});

test("can create multiple limit orders", async (t) => {
  const lucid = (await loadLucid(address)).assert();
  const builder = (await Builder.create(lucid)).assert();

  (await builder.limit(100, tokens.one, tokens.two, 1.3)).assert();
  const tx = (await builder.limit(100, tokens.one, tokens.two, 1.5)).assert();
  const cbor = (await tx.complete()).assert().toCBOR();
  const transaction = Transaction.from_cbor_hex(cbor);
  t.true(transaction.is_valid());
  t.is(transaction.body().mint()?.policy_count(), 1);
  t.is(transaction.body().outputs().len(), 3);
});
