import { generateSeedPhrase } from "@lucid-evolution/lucid";
import test from "ava";
import { loadLucid } from "cardano";
import { Seed } from "cardano-ts";

test("can load lucid without wallet", async (t) => {
  const lucid = (await loadLucid(process.env["BLOCKFROST_API_KEY"]!)).assert();
  t.truthy(lucid);
});

test("can load lucid with seed", async (t) => {
  const lucid = (await loadLucid(generateSeedPhrase())).assert();
  t.truthy(lucid);
});

test("can load lucid with address", async (t) => {
  const lucid = (
    await loadLucid(new Seed(generateSeedPhrase()).getAddress())
  ).assert();
  t.truthy(lucid);
});

test("can load lucid with seed and blockfrost key", async (t) => {
  const lucid = (
    await loadLucid(
      new Seed(generateSeedPhrase()).getAddress(),
      process.env["BLOCKFROST_API_KEY"]!
    )
  ).assert();
  t.truthy(lucid);
});
