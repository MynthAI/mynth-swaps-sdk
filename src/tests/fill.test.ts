import { Transaction } from "@anastasia-labs/cardano-multiplatform-lib-nodejs";
import { UTxO } from "@lucid-evolution/lucid";
import test from "ava";
import { Builder, loadLucid } from "mynth-swaps-sdk";
import { address, tokens } from "./wallet";

test("can fill limit order", async (t) => {
  const order = await placeAndFillLimitOrder(100, tokens.one, tokens.two, 1.5);
  t.true(order);
});

test("can fill limit order offering lovelace", async (t) => {
  const order = await placeAndFillLimitOrder(100, "lovelace", tokens.two, 1.5);
  t.true(order);
});

test("can fill limit order asking for lovelace", async (t) => {
  const order = await placeAndFillLimitOrder(100, tokens.one, "lovelace", 1.5);
  t.true(order);
});

const placeAndFillLimitOrder = async (
  amount: number,
  ask: string,
  offer: string,
  price: number
): Promise<boolean> => {
  const builder = await loadBuilder(address);

  (await builder.limit(amount, ask, offer, price)).assert();
  (await builder.complete()).assert();
  const swap = builder.getReferences()[0];

  return await fillOrder(builder, swap);
};

const loadBuilder = async (address: string) => {
  const lucid = (await loadLucid(address)).assert();
  return (await Builder.create(lucid)).assert();
};

const fillOrder = async (builder: Builder, utxo: UTxO): Promise<boolean> => {
  (await builder.fill(utxo)).assert();
  const cbor = (await builder.complete()).assert().toCBOR();
  const transaction = Transaction.from_cbor_hex(cbor);
  return transaction.is_valid();
};
