import {
  Constr,
  Data,
  getAddressDetails,
  Redeemer,
} from "@lucid-evolution/lucid";
import { type } from "arktype";
import { Err, isProblem, mayFail, Ok, Result } from "ts-handling";

const Address = type("string").pipe((v, ctx) => {
  const details = mayFail(() => getAddressDetails(v)).unwrap();
  if (isProblem(details)) return ctx.error("valid Cardano address");
  if (!details.paymentCredential)
    return ctx.error("valid Cardano address with payment key");
  if (!details.stakeCredential)
    return ctx.error("valid Cardano address with stake key");

  return {
    payment: details.paymentCredential.hash,
    stake: details.stakeCredential.hash,
  };
});
type Address = typeof Address.in.infer;

const ForwarderExtensionRedeemer = (
  $destination: Address
): Result<Redeemer, string> => {
  const destination = Address($destination);
  if (destination instanceof type.errors)
    return Err(`destination ${destination.summary}`);

  return Ok(Data.to(new Constr(0, [destination.payment, destination.stake])));
};

export default ForwarderExtensionRedeemer;
