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
import {
  ForwarderExtension,
  ForwarderExtensionRedeemer,
  from,
  SpendWithExtension,
} from "../../tx";

const forwardOrder = async (
  lucid: LucidEvolution,
  order: UTxO,
  swapReferenceScript: ReferenceUTxO,
  beaconReferenceScript: ReferenceUTxO,
  policyReferenceScript: ReferenceUTxO,
  forwarderReferenceScript: ReferenceUTxO,
  $tx?: TxBuilder
) => {
  const network = lucid.config().network;

  if (!order.datum) return Err("order must have datum");
  const datum = from.oneWaySwap(order.datum).unwrap();
  if (isProblem(datum)) return Err(datum.error);

  const details = getAddressDetails(order.address);
  if (!details.stakeCredential)
    return Err("Order UTXO is missing stake address");

  const forwarderAddress = validatorToRewardAddress(
    network,
    forwarderReferenceScript.scriptRef
  );
  const forwarderHash =
    getAddressDetails(forwarderAddress).stakeCredential!.hash;
  if (datum.extension !== forwarderHash)
    return Err("Order doesn't have forwarder extension enabled");

  // TODO: Allow different destinations
  const destination = await lucid.wallet().address();
  const [, expectedParams] = ForwarderExtension.create(
    forwarderReferenceScript,
    network,
    destination
  )
    .assert()
    .get()
    .assert();
  if (expectedParams !== datum.extensionParams)
    return Err(
      `Destination is incorrect; ${datum.extensionParams} != ${expectedParams}`
    );

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
  const redeemer = ForwarderExtensionRedeemer(destination).assert();
  return Ok(
    tx
      .collectFrom([order], SpendWithExtension)
      .readFrom([
        policyReferenceScript,
        beaconReferenceScript,
        swapReferenceScript,
        forwarderReferenceScript,
      ])
      .withdraw(beaconAddress, 0n, Data.void())
      .withdraw(forwarderAddress, 0n, redeemer)
      .mintAssets(beacons, Data.void())
      .pay.ToAddress(destination, swapAssets)
  );
};

export default forwardOrder;
