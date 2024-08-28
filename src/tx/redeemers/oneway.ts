import { Constr, Data } from "@lucid-evolution/lucid";

const $OneWaySwapRedeemers = [
  "SpendWithMint",
  "SpendWithStake",
  "SpendWithExtension",
  "Swap",
] as const;
type OneWaySwapRedeemer = (typeof $OneWaySwapRedeemers)[number];

const OneWaySwapRedeemers = $OneWaySwapRedeemers.reduce(
  (redeemers, redeemer, index) => {
    redeemers[redeemer] = Data.to(new Constr(index, []));
    return redeemers;
  },
  {} as Record<OneWaySwapRedeemer, string>
);

export default OneWaySwapRedeemers;
