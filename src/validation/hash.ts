import { type } from "arktype";

const Hash = type(/^[0-9A-Fa-f]{64}$/).pipe((v) => v.toLowerCase());
const OptionalHash = type("string").pipe((v) => (v === "" ? "" : Hash(v)));

export default Hash;
export { OptionalHash };
