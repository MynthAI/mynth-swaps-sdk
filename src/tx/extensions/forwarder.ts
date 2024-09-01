import {
  getAddressDetails,
  Network,
  validatorToRewardAddress,
} from "@lucid-evolution/lucid";
import { type } from "arktype";
import { Err, isProblem, mayFail, Ok } from "ts-handling";
import { ReferenceUTxO } from "../../cardano";
import { hash } from "../hash.js";
import Extension from "./extension.js";

const Address = type("string").pipe((address, ctx) => {
  const details = mayFail(() => getAddressDetails(address)).unwrap();
  if (isProblem(details)) return ctx.error("valid Cardano address");
  if (!details.paymentCredential)
    return ctx.error("valid Cardano address with payment credential");
  if (!details.stakeCredential)
    return ctx.error("valid Cardano address with stake credential");

  return [
    details.paymentCredential.hash,
    details.stakeCredential.hash,
  ] as const;
});
type Address = typeof Address.in.infer;

class Forwarder extends Extension {
  static create(
    script: ReferenceUTxO,
    network: Network,
    $destination: Address
  ) {
    const destination = Address($destination);
    if (destination instanceof type.errors) return Err(destination.summary);

    const address = validatorToRewardAddress(network, script.scriptRef);
    const params = hash(destination.join(""));
    return Ok(new Forwarder(address, params));
  }
}

export default Forwarder;
