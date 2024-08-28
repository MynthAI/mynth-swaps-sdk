import {
  LucidEvolution,
  TransactionError,
  TxBuilder,
  TxSignBuilder,
} from "@lucid-evolution/lucid";
import { Either } from "effect";
import { Err, isProblem, Ok, Result } from "ts-handling";
import { findReference, ReferenceUTxO } from "../cardano";
import loadConfig from "../config.js";
import { loadBlockfrost } from "../providers";
import { createLimitOrder } from "../tx/actions";
import { Amount } from "../tx/actions/limit.js";
import HookedLucid from "./hooks.js";

class Builder {
  private hooks: HookedLucid;
  private tx: TxBuilder;

  private constructor(
    private readonly lucid: LucidEvolution,
    private readonly beacon: ReferenceUTxO,
    private readonly policy: ReferenceUTxO,
    private readonly swap: ReferenceUTxO
  ) {
    this.hooks = new HookedLucid(lucid);
    this.tx = this.hooks.tx;
  }

  private resetTx() {
    this.hooks = new HookedLucid(this.lucid);
    this.tx = this.hooks.tx;
  }

  async limit(
    amount: Amount,
    offer: string,
    ask: string,
    price: Amount
  ): Promise<Result<this, string>> {
    const tx = await createLimitOrder(
      this.lucid,
      amount,
      offer,
      ask,
      price,
      this.swap,
      this.beacon,
      this.policy,
      this.tx
    );
    if (!tx.ok) return tx;
    return Ok(this);
  }

  async complete(): Promise<Result<TxSignBuilder, TransactionError>> {
    this.hooks.execute();
    const result = await this.tx.chainSafe();
    if (Either.isLeft(result)) return Err(result.left);

    const [utxos, , tx] = result.right;
    this.lucid.overrideUTxOs(utxos);
    this.resetTx();
    return Ok(tx);
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

    return Ok(new Builder(lucid, beacon, policy, swap));
  }
}

export default Builder;
