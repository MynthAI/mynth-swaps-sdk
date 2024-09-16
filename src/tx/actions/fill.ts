import {
  Data,
  LucidEvolution,
  TxBuilder,
  UTxO,
  validatorToRewardAddress,
} from "@lucid-evolution/lucid";
import { Decimal } from "decimal.js";
import { Err, isProblem, Ok } from "ts-handling";
import { ReferenceUTxO } from "../../cardano";
import { from, Swap } from "../../tx";

const fillOrder = async (
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

  const assets = { ...order.assets };
  delete assets[datum.offer];
  const beaconAddress = validatorToRewardAddress(
    network,
    beaconReferenceScript.scriptRef
  );

  const [numerator, denominator] = toDecimals(datum.swapPrice);
  const offerToken = datum.offer || "lovelace";
  const askToken = datum.ask || "lovelace";

  const cost = BigInt(
    numerator
      .mul(order.assets[offerToken].toString())
      .div(denominator)
      .toDecimalPlaces(0, Decimal.ROUND_UP)
      .toFixed(0)
  );

  assets[askToken] = (assets[askToken] || 0n) + cost;

  const tx = $tx || lucid.newTx();
  return Ok(
    tx
      .collectFrom([order], Swap)
      .readFrom([
        policyReferenceScript,
        beaconReferenceScript,
        swapReferenceScript,
      ])
      .withdraw(beaconAddress, 0n, Data.void())
      .pay.ToContract(
        order.address,
        { kind: "inline", value: order.datum },
        assets
      )
  );
};

const toDecimals = (values: bigint[]) =>
  values.map((value) => new Decimal(value.toString()));

export default fillOrder;
