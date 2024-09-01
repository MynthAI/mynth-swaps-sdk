import {
  credentialToRewardAddress,
  Data,
  getAddressDetails,
  LucidEvolution,
  mintingPolicyToId,
  TxBuilder,
  UTxO,
  validatorToRewardAddress,
} from "@lucid-evolution/lucid";
import { type } from "arktype";
import { Err, isProblem, Ok } from "ts-handling";
import { Address, ReferenceUTxO } from "../../cardano";
import { from, SpendWithExtension } from "../../tx";

const poaOrder = async (
  lucid: LucidEvolution,
  order: UTxO,
  swapReferenceScript: ReferenceUTxO,
  beaconReferenceScript: ReferenceUTxO,
  policyReferenceScript: ReferenceUTxO,
  $authority: Address,
  $tx?: TxBuilder
) => {
  const network = lucid.config().network;
  const authority = Address(network)($authority);
  if (authority instanceof type.errors)
    return Err(`authority ${authority.summary}`);

  if (!order.datum) return Err("order must have datum");
  const datum = from.oneWaySwap(order.datum).unwrap();
  if (isProblem(datum)) return Err(datum.error);

  const details = getAddressDetails(order.address);
  if (!details.stakeCredential)
    return Err("Order UTXO is missing stake address");

  const authorityStakeCredential =
    getAddressDetails(authority).stakeCredential!;
  const authorityRewardAddress = credentialToRewardAddress(
    network,
    authorityStakeCredential
  );
  if (datum.extension !== authorityStakeCredential.hash)
    return Err("POA doesn't have authority over order");

  const policyId = mintingPolicyToId(policyReferenceScript.scriptRef);
  const beacons = {
    [policyId + datum.askBeacon]: -1n,
    [policyId + datum.offerBeacon]: -1n,
    [policyId + datum.pairBeacon]: -1n,
  };
  const beaconAddress = validatorToRewardAddress(
    network,
    beaconReferenceScript.scriptRef
  );

  const swapAssets = { ...order.assets };
  delete swapAssets[policyId + datum.askBeacon];
  delete swapAssets[policyId + datum.offerBeacon];
  delete swapAssets[policyId + datum.pairBeacon];

  const tx = $tx || lucid.newTx();
  return Ok(
    tx
      .collectFrom([order], SpendWithExtension)
      .readFrom([
        policyReferenceScript,
        beaconReferenceScript,
        swapReferenceScript,
      ])
      .withdraw(beaconAddress, 0n, Data.void())
      .mintAssets(beacons, Data.void())
      .pay.ToAddress(authority, swapAssets)
      .addSigner(authorityRewardAddress)
  );
};

export default poaOrder;
