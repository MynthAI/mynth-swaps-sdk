import { ScriptHash } from "@anastasia-labs/cardano-multiplatform-lib-nodejs";
import {
  LucidEvolution,
  paymentCredentialOf,
  TransactionError,
  TxBuilder,
  TxSignBuilder,
  UTxO,
  validatorToAddress,
} from "@lucid-evolution/lucid";
import { Either } from "effect";
import { Err, isProblem, Ok, Result } from "ts-handling";
import { findReference, ReferenceUTxO } from "../cardano";
import loadConfig from "../config.js";
import { loadBlockfrost } from "../providers";
import { Extension, NullExtension } from "../tx";
import {
  attachMetadata,
  cancelLimitOrder,
  createLimitOrder,
  fillOrder,
  Label,
  Metadata,
} from "../tx/actions";
import { Amount } from "../tx/actions/limit.js";
import HookedLucid from "./hooks.js";

type BuildTx = (
  lucid: LucidEvolution,
  tx: TxBuilder,
  beacon: ReferenceUTxO,
  policy: ReferenceUTxO,
  swap: ReferenceUTxO
) => Promise<Result<TxBuilder, string>>;

class Builder {
  private hooks: HookedLucid;
  private references: UTxO[] = [];
  private tx: TxBuilder;

  private constructor(
    private readonly lucid: LucidEvolution,
    private readonly beacon: ReferenceUTxO,
    private readonly policy: ReferenceUTxO,
    private readonly swap: ReferenceUTxO,
    public readonly swapPaymentKey: string
  ) {
    this.hooks = new HookedLucid(lucid);
    this.tx = this.hooks.tx;
  }

  clone(lucid: LucidEvolution) {
    return new Builder(
      lucid,
      this.beacon,
      this.policy,
      this.swap,
      this.swapPaymentKey
    );
  }

  getReferenceUtxos() {
    return {
      beacon: { ...this.beacon },
      policy: { ...this.policy },
      swap: { ...this.swap },
    };
  }

  private resetTx() {
    this.hooks = new HookedLucid(this.lucid);
    this.tx = this.hooks.tx;
  }

  async limit(
    amount: Amount,
    offer: string,
    ask: string,
    price: Amount,
    extension?: Extension,
    lockedUntil?: number
  ): Promise<Result<this, string>>;
  async limit(
    amount: Amount,
    offer: string,
    ask: string,
    price: Amount,
    extension: Extension
  ): Promise<Result<this, string>>;
  async limit(
    amount: Amount,
    offer: string,
    ask: string,
    price: Amount,
    lockedUntil: number
  ): Promise<Result<this, string>>;
  async limit(
    amount: Amount,
    offer: string,
    ask: string,
    price: Amount,
    extensionOrLockedUntil: number | Extension = NullExtension,
    $lockedUntil: number = 0
  ): Promise<Result<this, string>> {
    const lockedUntil =
      typeof extensionOrLockedUntil === "number"
        ? extensionOrLockedUntil
        : $lockedUntil;
    const extension =
      extensionOrLockedUntil instanceof Extension
        ? extensionOrLockedUntil
        : NullExtension;
    const tx = await createLimitOrder(
      this.lucid,
      amount,
      offer,
      ask,
      price,
      this.swap,
      this.beacon,
      this.policy,
      this.tx,
      extension,
      lockedUntil
    );
    if (!tx.ok) return tx;
    return Ok(this);
  }

  async cancel(order: UTxO): Promise<Result<this, string>> {
    const tx = await cancelLimitOrder(
      this.lucid,
      order,
      this.swap,
      this.beacon,
      this.policy,
      this.tx
    );
    if (!tx.ok) return tx;
    return Ok(this);
  }

  async fill(order: UTxO): Promise<Result<this, string>> {
    const tx = await fillOrder(
      this.lucid,
      order,
      this.swap,
      this.beacon,
      this.policy,
      this.tx
    );
    if (!tx.ok) return tx;
    return Ok(this);
  }

  addMetadata(label: Label, metadata: Metadata): Result<this, string> {
    const tx = attachMetadata(this.tx, label, metadata);
    if (!tx.ok) return tx;
    return Ok(this);
  }

  async run(builder: BuildTx) {
    const tx = await builder(
      this.lucid,
      this.tx,
      this.beacon,
      this.policy,
      this.swap
    );
    if (!tx.ok) return tx;
    return Ok(this);
  }

  async complete(): Promise<Result<TxSignBuilder, TransactionError>> {
    this.hooks.execute();
    const result = await this.tx.chainSafe();
    if (Either.isLeft(result)) return Err(result.left);

    const [utxos, references, tx] = result.right;
    this.lucid.overrideUTxOs(utxos);
    this.resetTx();
    this.references = references;
    return Ok(tx);
  }

  getReferences() {
    return [...this.references];
  }

  static async create(lucid: LucidEvolution) {
    const network = lucid.config().network;
    const provider = loadBlockfrost(lucid).unwrap();
    if (isProblem(provider)) return Err(provider.error);

    const config = loadConfig(network).unwrap();
    if (isProblem(config)) return Err(config.error);
    const { oneWay } = config;

    const references = await Promise.all([
      findReference(provider, oneWay.beacon),
      findReference(provider, oneWay.policy),
      findReference(provider, oneWay.swap),
    ]);
    const [beacon, policy, swap] = references.map((r) => r.unwrap());
    if (isProblem(beacon)) return Err(beacon.error);
    if (isProblem(policy)) return Err(policy.error);
    if (isProblem(swap)) return Err(swap.error);

    const key = ScriptHash.from_hex(
      paymentCredentialOf(
        validatorToAddress(lucid.config().network, swap.scriptRef)
      ).hash
    ).to_bech32("addr_vkh");
    return Ok(new Builder(lucid, beacon, policy, swap, key));
  }
}

export default Builder;
export { BuildTx };
