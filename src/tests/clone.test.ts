import { generateSeedPhrase } from "@lucid-evolution/lucid";
import test from "ava";
import { Seed } from "cardano-ts";
import { Builder, loadLucid } from "mynth-swaps-sdk";
import { address } from "./wallet";

test("can clone Builder", async (t) => {
  const lucid = (await loadLucid(address)).assert();
  const builder = (await Builder.create(lucid)).assert();

  const anotherLucid = (
    await loadLucid(new Seed(generateSeedPhrase()).getAddress())
  ).assert();
  const newBuilder = builder.clone(anotherLucid);
  t.deepEqual(builder.getReferenceUtxos(), newBuilder.getReferenceUtxos());
});
