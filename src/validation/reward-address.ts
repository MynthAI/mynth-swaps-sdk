import { getAddressDetails } from "@lucid-evolution/lucid";
import { type } from "arktype";
import { isProblem, mayFail } from "ts-handling";

const RewardAddress = type("string").pipe((v, ctx) => {
  if (/^[0-9a-f]{56}$/.test(v)) return v;

  const details = mayFail(() => getAddressDetails(v)).unwrap();
  if (isProblem(details)) return ctx.error("valid reward address");
  if (!details.stakeCredential)
    return ctx.error("valid address with stake credential");

  return details.stakeCredential.hash;
});

export default RewardAddress;
