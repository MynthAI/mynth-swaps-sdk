import {
  Blockfrost,
  getAddressDetails,
  Lucid,
  LucidEvolution,
  TxBuilder,
} from "@lucid-evolution/lucid";
import { type } from "arktype";
import { Seed as SeedClass } from "cardano-ts";
import { capitalize } from "es-toolkit/string";
import { Err, isProblem, mayFail, Ok, Result } from "ts-handling";

const buffer = 60000; // About 1 minute
const expiresIn = 600000; // About 10 minutes

const Network = type("'Mainnet'|'Preview'|'Preprod'|'Custom'");
type Network = typeof Network.infer;
const BlockfrostNetwork = type("string>7")
  .pipe((s) => capitalize(s.substring(0, 7)))
  .pipe((s) => Network(s));

const Address = (network: Network) =>
  type("string").narrow((s, ctx) => {
    const expectedNetworkId = network === "Mainnet" ? 1 : 0;
    const details = mayFail(() => getAddressDetails(s)).unwrap();
    if (isProblem(details)) return ctx.mustBe("valid Cardano address");

    if (details.networkId !== expectedNetworkId)
      return ctx.mustBe("correct network");
    return (
      !!details.paymentCredential || ctx.mustBe("valid Cardano payment address")
    );
  });
const $Address = Address("Mainnet");
type Address = typeof $Address.in.infer;

const Seed = type("string").narrow(
  (s, ctx) =>
    mayFail(() => new SeedClass(s).getAddress()).ok ||
    ctx.mustBe("valid seed phrase")
);
type Seed = typeof Seed.in.infer;

const loadLucid = async (
  wallet: Address | Seed,
  blockfrostApiKey?: string
): Promise<Result<LucidEvolution, string>> => {
  const blockfrost = blockfrostApiKey || process.env["BLOCKFROST_API_KEY"];
  if (!blockfrost) return Err("Blockfrost key must be set");
  const network = BlockfrostNetwork(blockfrost);
  if (network instanceof type.errors) return Err(network.summary);

  const lucid = await Lucid(
    new Blockfrost(
      `https://cardano-${network.toLowerCase()}.blockfrost.io/api/v0`,
      blockfrost
    ),
    network
  );

  const address = Address(network)(wallet);
  const seed = Seed(wallet);

  if (!(address instanceof type.errors)) {
    const utxos = await lucid.utxosAt(address);
    lucid.selectWallet.fromAddress(address, utxos);
    return hookLucid(lucid);
  }

  if (!(seed instanceof type.errors)) {
    lucid.selectWallet.fromSeed(seed);
    return hookLucid(lucid);
  }

  return Err(`${address.summary}\n${seed.summary}`);
};

const hookLucid = (lucid: LucidEvolution) => {
  const newTx = lucid.newTx;
  lucid.newTx = () => setValidity(Date.now(), newTx());
  return Ok(lucid);
};

const setValidity = (now: number, tx: TxBuilder) =>
  tx.validFrom(now - buffer).validTo(now + expiresIn);

export default loadLucid;
