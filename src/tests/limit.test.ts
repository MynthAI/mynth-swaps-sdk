import { Transaction } from "@anastasia-labs/cardano-multiplatform-lib-nodejs";
import test from "ava";
import { Builder, from, loadLucid } from "mynth-swaps-sdk";
import { isProblem } from "ts-handling";
import { address, tokens } from "./wallet";

test("can create limit order", async (t) => {
  const lucid = (await loadLucid(address)).assert();
  const builder = (await Builder.create(lucid)).assert();
  const oneHourInMs = 3600000;
  const tx = (
    await builder.limit(100, tokens.one, tokens.two, 1.5, oneHourInMs)
  ).assert();
  const cbor = (await tx.complete()).assert().toCBOR();
  const transaction = Transaction.from_cbor_hex(cbor);

  const datumHash = transaction
    .body()
    .outputs()
    .get(0)
    .datum()
    ?.as_datum()
    ?.to_cbor_hex();
  if (datumHash === undefined) return t.fail("Datum cannot be empty");

  const datum = from.oneWaySwap(datumHash).unwrap();
  if (isProblem(datum)) return t.fail(`Malformed datum: ${datum.error}`);

  t.true(transaction.is_valid());
  t.is(transaction.body().mint()?.policy_count(), 1);
  t.is(transaction.body().outputs().len(), 2);
  t.true(datum.lockedUntil > oneHourInMs);
});

test("can create limit order with metadata", async (t) => {
  const metadata = {
    0: "TP9bjm9sUojb3hJgy32vd12tSEj2S5tK9e",
    1: "TBaHFSF5jVnZP9uD6pWrMyEzm2qHQ6mxT3",
  };
  const lucid = (await loadLucid(address)).assert();
  const builder = (await Builder.create(lucid)).assert();

  const tx = (await builder.limit(100, tokens.one, tokens.two, 1.5)).assert();
  const txWithMetadata = (await tx.addMetadata(378, metadata)).assert();
  const cbor = (await txWithMetadata.complete()).assert().toCBOR();
  const transaction = Transaction.from_cbor_hex(cbor);

  const datumHash = transaction
    .body()
    .outputs()
    .get(0)
    .datum()
    ?.as_datum()
    ?.to_cbor_hex();
  if (datumHash === undefined) return t.fail("Datum cannot be empty");

  const datum = from.oneWaySwap(datumHash).unwrap();
  if (isProblem(datum)) return t.fail(`Malformed datum: ${datum.error}`);

  t.true(transaction.is_valid());
  t.is(transaction.body().mint()?.policy_count(), 1);
  t.is(transaction.body().outputs().len(), 2);
  t.not(transaction.auxiliary_data()?.metadata()?.get_all(378n), undefined);
  t.is(datum.lockedUntil, 0);
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
