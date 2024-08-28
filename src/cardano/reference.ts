import { Script, UTxO } from "@lucid-evolution/lucid";
import { type } from "arktype";
import { Provider } from "cardano-ts";
import { Err, isProblem, mayFailAsync, Ok, Result } from "ts-handling";

const Token = type(/^[0-9a-f]{56}(?:[0-9a-f]{2}){0,32}$/);
type Token = typeof Token.in.infer;

const TransactionHash = type(/^[0-9a-f]{64}$/);
type TransactionHash = typeof TransactionHash.in.infer;

type ReferenceUTxO = Omit<UTxO, "scriptRef"> & { scriptRef: Script };
type MaybeUTxO = UTxO | undefined;

const findReference = async (
  provider: Provider,
  id: Token | TransactionHash
): Promise<Result<ReferenceUTxO, string>> => {
  const token = Token(id);
  const transactionHash = TransactionHash(id);

  if (!(transactionHash instanceof type.errors)) {
    const result = await findReferenceFromTx(provider, id);
    if (result.ok) return Ok(result.data);

    return token instanceof type.errors
      ? findReferenceFromToken(provider, id)
      : Err(result.error);
  }

  if (!(token instanceof type.errors))
    return findReferenceFromToken(provider, id);

  return Err("id must be a token or transaction hash");
};

const findReferenceFromToken = async (
  provider: Provider,
  token: string
): Promise<Result<ReferenceUTxO, string>> => {
  const address = (
    await mayFailAsync(() => provider.findToken(token))
  ).unwrap();
  if (isProblem(address)) return Err(address.error);

  const utxos = (await mayFailAsync(() => provider.getUtxos(address))).unwrap();
  if (isProblem(utxos)) return Err(utxos.error);

  const reference: MaybeUTxO = utxos.find((utxo) =>
    Object.keys(utxo.assets).includes(token)
  );
  if (!reference || !isReferenceUtxo(reference))
    return Err("Couldn't find reference UTXO");
  return Ok(reference);
};

const findReferenceFromTx = async (
  provider: Provider,
  txHash: string
): Promise<Result<ReferenceUTxO, string>> => {
  const utxos = (
    await mayFailAsync(() => provider.getTransactionUtxos(txHash))
  ).unwrap();
  if (isProblem(utxos)) return Err(utxos.error);

  const reference: MaybeUTxO = utxos.find((utxo) => !!utxo.scriptRef);
  if (!reference || !isReferenceUtxo(reference))
    return Err("Couldn't find reference UTXO");
  return Ok(reference);
};

const isReferenceUtxo = (utxo: UTxO): utxo is ReferenceUTxO => !!utxo.scriptRef;

export { findReference, ReferenceUTxO };
