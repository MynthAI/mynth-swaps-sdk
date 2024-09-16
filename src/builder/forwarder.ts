import {
  Address,
  LucidEvolution,
  TxBuilder,
  UTxO,
} from "@lucid-evolution/lucid";
import { Err, isProblem, Ok, Result } from "ts-handling";
import { findReference, ReferenceUTxO } from "../cardano";
import loadConfig from "../config.js";
import { loadBlockfrost } from "../providers";
import { Extension, ForwarderExtension, forwardOrder } from "../tx";
import { BuildTx } from "./builder.js";

class Forwarder {
  private constructor(
    public readonly extension: Extension,
    private readonly reference: ReferenceUTxO
  ) {}

  getReference() {
    return { ...this.reference };
  }

  static async create(
    lucid: LucidEvolution,
    destination?: Address
  ): Promise<Result<Forwarder, string>> {
    const network = lucid.config().network;
    const provider = loadBlockfrost(lucid).unwrap();
    if (isProblem(provider)) return Err(provider.error);
    const config = loadConfig(network).unwrap();
    if (isProblem(config)) return Err(config.error);
    const {
      oneWay: { forwarder },
    } = config;
    const reference = (await findReference(provider, forwarder)).unwrap();
    if (isProblem(reference)) return Err(reference.error);

    const extension = ForwarderExtension.create(
      reference,
      network,
      destination || (await lucid.wallet().address())
    ).unwrap();
    if (isProblem(extension)) return Err(extension.error);

    return Ok(new Forwarder(extension, reference));
  }

  build(order: UTxO): BuildTx {
    return (
      lucid: LucidEvolution,
      tx: TxBuilder,
      beacon: ReferenceUTxO,
      policy: ReferenceUTxO,
      swap: ReferenceUTxO
    ) => {
      return forwardOrder(
        lucid,
        order,
        swap,
        beacon,
        policy,
        this.reference,
        tx
      );
    };
  }
}

export default Forwarder;
