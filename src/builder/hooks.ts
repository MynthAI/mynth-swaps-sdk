import {
  Assets,
  LucidEvolution,
  RedeemerBuilder,
  TxBuilder,
} from "@lucid-evolution/lucid";

type MintAssets = (
  assets: Assets,
  redeemer?: string | RedeemerBuilder
) => TxBuilder;

type Hooks = {
  mintAssets: MintAssets;
};

class HookedLucid {
  private readonly originals: Hooks;
  private readonly mints: Record<string, Assets> = {};
  public readonly tx: TxBuilder;

  constructor(lucid: LucidEvolution) {
    const tx = lucid.newTx();
    this.originals = { mintAssets: tx.mintAssets };
    tx.mintAssets = this.mintAssets(tx);
    this.tx = tx;
  }

  private mintAssets(tx: TxBuilder): MintAssets {
    return (assets: Assets, redeemer?: string | RedeemerBuilder) => {
      if (!redeemer || typeof redeemer !== "string")
        return this.originals.mintAssets(assets, redeemer);

      this.mints[redeemer] = Object.entries(assets).reduce(
        (mints, [asset, amount]) => {
          mints[asset] = (mints[asset] || 0n) + amount;
          return mints;
        },
        this.mints[redeemer] || {}
      );
      return tx;
    };
  }

  execute() {
    for (const [redeemer, assets] of Object.entries(this.mints))
      this.originals.mintAssets(assets, redeemer);
  }
}

export default HookedLucid;
