import { TxBuilder } from "@lucid-evolution/lucid";
import { scope, type } from "arktype";
import { Err, mayFail, Ok } from "ts-handling";

const Label = type("number>=0").narrow(
  (n, ctx) =>
    Number(mayFail(() => BigInt(n)).or(0n)) === n ||
    ctx.mustBe("non-decimal number")
);

const Metadata = scope({
  Uint8Array: type("instanceof", Uint8Array),
  AllowedValues: "string|number|Uint8Array",
  Array: "AllowedValues[]",
  Metadata: "Array|Record<string,AllowedValues|Array>",
}).export().Metadata;

const attachMetadata = (
  tx: TxBuilder,
  label: number,
  metadata: typeof Metadata.infer
) => {
  const $label = Label(label);
  if ($label instanceof type.errors) return Err($label.summary);

  const $metadata = Metadata(metadata);
  if ($metadata instanceof type.errors) return Err($metadata.summary);

  return Ok(tx.attachMetadata(label, { ...metadata }));
};

export default attachMetadata;
export { Label, Metadata };
