import {
  Constr,
  Data,
  Datum,
  fromText,
  getAddressDetails,
} from "@lucid-evolution/lucid";
import { type } from "arktype";
import { isProblem, mayFail, Ok, Result } from "ts-handling";
import { validate, validateAll } from "../../validation";
import Rational from "./rational.js";

const DateType = type("string|number>=0").pipe((v, ctx) => {
  if (v === 0) return 0n;

  if (typeof v === "string") {
    const time = new Date(v).getTime();
    return time >= 0 ? BigInt(time) : ctx.error("valid date");
  }

  const milliseconds = mayFail(() => BigInt(v));
  return milliseconds.ok
    ? BigInt(Date.now()) + milliseconds.data
    : ctx.error("valid milliseconds");
});
type DateType = typeof DateType.in.infer;

const Token = type("string").pipe((v, ctx) => {
  const value = v.toLowerCase();

  if (!value || value === "lovelace")
    return {
      policy: "",
      name: "",
    };

  const policy = value.substring(0, 56).toLowerCase();
  if (!/^[0-9a-f]+$/.test(policy)) return ctx.error("hex value");
  if (policy.length != 56) return ctx.error("at least 56 characters");

  let name = value.substring(56);
  if (!/^[0-9a-f]+$/.test(name)) name = fromText(name);
  // 56 + 64 == 120
  if (name.length > 64) return ctx.error("no more than 120 characters");
  if (name.length % 2 !== 0) return ctx.error("even length");

  return {
    policy,
    name,
  };
});
type Token = typeof Token.in.infer;

const AssetName = type("string").pipe((v, ctx) => {
  const name = /^[0-9a-f]+$/.test(v) ? v : fromText(v);
  if (name.length > 64) return ctx.error("less than or equal to 65 characters");
  return name;
});
type AssetName = typeof AssetName.in.infer;

const RewardAddress = type("string").pipe((v, ctx) => {
  const details = mayFail(() => getAddressDetails(v)).unwrap();
  if (isProblem(details)) return ctx.error("valid reward address");
  if (!details.stakeCredential)
    return ctx.error("valid address with stake credential");

  return details.stakeCredential.hash;
});
const OptionalRewardAddress = type("string").pipe((v) =>
  v === "" ? "" : RewardAddress(v)
);
type OptionalRewardAddress = typeof OptionalRewardAddress.in.infer;

const Hash = type(/^[0-9A-Fa-f]{64}$/).pipe((v) => v.toLowerCase());
const OptionalHash = type("string").pipe((v) => (v === "" ? "" : Hash(v)));
type OptionalHash = typeof OptionalHash.in.infer;

const OneWaySwapDatum = (
  $pairBeacon: AssetName,
  $offer: Token,
  $offerBeacon: AssetName,
  $ask: Token,
  $askBeacon: AssetName,
  $swapPrice: Rational,
  $lockedUntil: DateType = 0,
  $extension: OptionalRewardAddress = "",
  $extensionParams: OptionalHash = ""
): Result<Datum, string> => {
  const validations = validateAll([
    validate(DateType($lockedUntil), "lockedUntil"),
    validate(AssetName($pairBeacon), "pairBeacon"),
    validate(Token($offer), "offer"),
    validate(AssetName($offerBeacon), "offerBeacon"),
    validate(Token($ask), "ask"),
    validate(AssetName($askBeacon), "askBeacon"),
    validate(Rational($swapPrice), "swapPrice"),
    validate(OptionalRewardAddress($extension), "extension"),
    validate(OptionalHash($extensionParams), "extensionParams"),
  ] as const);
  if (!validations.ok) return validations;

  const [
    lockedUntil,
    pairBeacon,
    offer,
    offerBeacon,
    ask,
    askBeacon,
    swapPrice,
    extension,
    extensionParams,
  ] = validations.data;

  return Ok(
    Data.to(
      new Constr(0, [
        lockedUntil,
        pairBeacon,
        offer.policy,
        offer.name,
        offerBeacon,
        ask.policy,
        ask.name,
        askBeacon,
        new Constr(0, [...swapPrice]),
        extension,
        extensionParams,
      ])
    )
  );
};

export default OneWaySwapDatum;
