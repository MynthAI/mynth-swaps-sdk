import {
  Data,
  getAddressDetails,
  LucidEvolution,
  mintingPolicyToId,
  TxBuilder,
  validatorToAddress,
  validatorToRewardAddress,
} from "@lucid-evolution/lucid";
import { scope, type } from "arktype";
import Decimal from "decimal.js";
import { Err, isProblem, mayFail, Ok } from "ts-handling";
import { ReferenceUTxO } from "../../cardano";
import { OneWaySwapDatum } from "../datums";
import { Extension, NullExtension } from "../extensions";
import { hash } from "../hash.js";

const DecimalType = type("string|number").pipe((v, ctx) => {
  const value = mayFail(() => new Decimal(v)).unwrap();
  return isProblem(value)
    ? ctx.error("valid decimal")
    : BigInt(value.mul(10 ** 6).toFixed(0));
});

const Amount = scope({
  DecimalType,
  Amount: "DecimalType|bigint",
})
  .export()
  .Amount.narrow((v, ctx) => v > 0n || ctx.mustBe("positive"));

type Amount = typeof Amount.in.infer;

const RewardAddress = type("string").pipe((v, ctx) => {
  const details = mayFail(() => getAddressDetails(v)).unwrap();
  if (isProblem(details)) return ctx.error("valid reward address");
  if (!details.stakeCredential)
    return ctx.error("valid address with stake credential");

  return details.stakeCredential;
});
type RewardAddress = typeof RewardAddress.in.infer;

const createLimitOrder = async (
  lucid: LucidEvolution,
  $amount: Amount,
  offer: string,
  ask: string,
  $price: Amount,
  swapReferenceScript: ReferenceUTxO,
  beaconReferenceScript: ReferenceUTxO,
  policyReferenceScript: ReferenceUTxO,
  $tx?: TxBuilder,
  $extension: Extension = NullExtension,
  $reward?: RewardAddress
) => {
  const amount = Amount($amount);
  if (amount instanceof type.errors) return Err(`amount ${amount.summary}`);
  const price = Amount($price);
  if (price instanceof type.errors) return Err(`price ${price.summary}`);
  const reward = RewardAddress($reward || (await lucid.wallet().address()));
  if (reward instanceof type.errors) return Err(`reward ${reward.summary}`);

  const beaconScript = beaconReferenceScript.scriptRef;
  const policyScript = policyReferenceScript.scriptRef;
  const swapScript = swapReferenceScript.scriptRef;
  const network = lucid.config().network;
  const swapAddress = validatorToAddress(network, swapScript, reward);
  const beaconAddress = validatorToRewardAddress(network, beaconScript);
  const policyId = mintingPolicyToId(policyScript);
  const beacon = getBeacon(offer, ask, policyId);

  const extension = $extension.get();
  if (!extension.ok) return Err(`extension ${extension.error}`);
  const datum = OneWaySwapDatum(
    beacon.pair,
    offer,
    beacon.offer,
    ask,
    beacon.ask,
    [price, 1000000],
    0,
    extension.data[0],
    extension.data[1]
  ).unwrap();
  if (isProblem(datum)) return Err(datum.error);

  const tx = $tx || lucid.newTx();
  return Ok(
    tx
      .mintAssets(beacon.assets, Data.void())
      .withdraw(beaconAddress, 0n, Data.void())
      .readFrom([policyReferenceScript, beaconReferenceScript])
      .pay.ToContract(
        swapAddress,
        { kind: "inline", value: datum },
        // TODO: if offer is lovelace, add min lovelace
        { ...beacon.assets, [offer]: amount }
      )
  );
};

const getBeacon = (token1: string, token2: string, policy: string) => {
  const pair = hash(getName(token1, "00") + getName(token2, "00"));
  const offer = hash("01" + token1);
  const ask = hash("02" + token2);
  const assets = {
    [policy + pair]: 1n,
    [policy + offer]: 1n,
    [policy + ask]: 1n,
  };

  return {
    pair,
    offer,
    ask,
    assets,
  };
};

const getName = (name: string, v: string = "00") =>
  !!name && name !== "lovelace" ? name : v;

export default createLimitOrder;
export type { Amount };
