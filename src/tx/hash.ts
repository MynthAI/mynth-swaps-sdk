import blake2 from "blake2";

const hash = (value: string) =>
  blake2
    .createHash("blake2b", { digestLength: 32 })
    .update(Buffer.from(value, "hex"))
    .digest("hex");

export { hash };
