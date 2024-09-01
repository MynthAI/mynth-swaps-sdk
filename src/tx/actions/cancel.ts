import {
  Data,
  getAddressDetails,
  LucidEvolution,
  mintingPolicyToId,
  TxBuilder,
  UTxO,
  validatorToRewardAddress,
} from "@lucid-evolution/lucid";
import { Err, isProblem, Ok } from "ts-handling";
import { ReferenceUTxO } from "../../cardano";
import { from, SpendWithMint } from "../../tx";

const cancelLimitOrder = async (
  lucid: LucidEvolution,
  order: UTxO,
  swapReferenceScript: ReferenceUTxO,
  beaconReferenceScript: ReferenceUTxO,
  policyReferenceScript: ReferenceUTxO,
  $tx?: TxBuilder
) => {
  const network = lucid.config().network;

  if (!order.datum) return Err("order must have datum");
  const datum = from.oneWaySwap(order.datum).unwrap();
  if (isProblem(datum)) return Err(datum.error);

  const details = getAddressDetails(order.address);
  if (!details.stakeCredential)
    return Err("Order UTXO is missing stake address");
  const owner = details.stakeCredential;

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

  const tx = $tx || lucid.newTx();
  return Ok(
    tx
      .collectFrom([order], SpendWithMint)
      .readFrom([
        policyReferenceScript,
        beaconReferenceScript,
        swapReferenceScript,
      ])
      .withdraw(beaconAddress, 0n, Data.void())
      .mintAssets(beacons, Data.void())
      .addSignerKey(owner.hash)
  );
};

export default cancelLimitOrder;
