import { type } from "arktype";
import { mayFail } from "ts-handling";

const Numberish = type("string|number|bigint").pipe((v, ctx) => {
  const value = mayFail(() => BigInt(v));
  return value.ok ? value.data : ctx.error("valid whole number");
});

const Rational = type([Numberish, Numberish]).pipe(
  ([numerator, denominator], ctx) => {
    if (denominator <= 0) return ctx.error("positive denominator");
    const divisor = calculateGreatestCommonDivisor(numerator, denominator);
    return [numerator / divisor, denominator / divisor] as const;
  }
);

type Rational = typeof Rational.in.infer;

const calculateGreatestCommonDivisor = (a: bigint, b: bigint): bigint => {
  if (b === 0n) return a;
  return calculateGreatestCommonDivisor(b, a % b);
};

export default Rational;
