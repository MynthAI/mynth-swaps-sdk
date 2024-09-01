import { type } from "arktype";
import { Err, Ok, Result } from "ts-handling";
import { OptionalHash, RewardAddress } from "../../validation";

type Properties = [RewardAddress, OptionalHash];

abstract class Extension {
  protected constructor(
    private readonly address: RewardAddress,
    private readonly hash: OptionalHash
  ) {}

  get(): Result<Properties, string> {
    const address = RewardAddress(this.address);
    const hash = OptionalHash(this.hash);

    if (address instanceof type.errors)
      return Err(`address ${address.summary}`);
    if (hash instanceof type.errors) return Err(`hash ${hash.summary}`);

    return Ok([address, hash]);
  }
}

export default Extension;
