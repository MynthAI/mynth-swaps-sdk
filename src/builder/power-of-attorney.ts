import { LucidEvolution, TxBuilder, UTxO } from "@lucid-evolution/lucid";
import { type } from "arktype";
import { Err, Ok, Result } from "ts-handling";
import { Address, ReferenceUTxO } from "../cardano";
import { Extension, poaOrder, PowerOfAttorneyExtension } from "../tx";
import { BuildTx } from "./builder.js";

class PowerOfAttorney {
  private constructor(
    public readonly extension: Extension,
    private readonly authority: Address
  ) {}

  static async create(
    lucid: LucidEvolution,
    $authority?: Address
  ): Promise<Result<PowerOfAttorney, string>> {
    const network = lucid.config().network;
    const authority = Address(network)(
      $authority || (await lucid.wallet().address())
    );
    if (authority instanceof type.errors)
      return Err(`authority ${authority.summary}`);

    const extension = PowerOfAttorneyExtension.create(authority).assert();
    return Ok(new PowerOfAttorney(extension, authority));
  }

  build(order: UTxO): BuildTx {
    return (
      lucid: LucidEvolution,
      tx: TxBuilder,
      beacon: ReferenceUTxO,
      policy: ReferenceUTxO,
      swap: ReferenceUTxO
    ) => {
      return poaOrder(lucid, order, swap, beacon, policy, this.authority, tx);
    };
  }
}

export default PowerOfAttorney;
